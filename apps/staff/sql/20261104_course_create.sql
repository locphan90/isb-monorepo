-- Tạo khóa học (Academic Admin > Create Course): nhập theo QUÝ, số thứ tự lớp cấp tự động, Rate tra theo loại môn.
-- File này chạy lại được nhiều lần (idempotent): nếu bản trước đã chạy, chạy lại bản này để nâng cấp hàm create_course.
--
-- 1) Cột mới tbl_course.rate (numeric, cho phép null): Rate của khóa, chụp lại tại thời điểm tạo khóa (đổi Rate sau này không làm đổi khóa cũ).
-- 2) find_rate(domain, loại môn, quý): Rate đang hiệu lực của (domain, loại môn) tại một quý, lấy từ tbl_misc cat = 'RATE'
--    (obj_json = { Domain, SubjectType, Rate, ValidFrom, ValidThru }; quý dạng 'YYYYQn', ValidThru '' = chưa kết thúc,
--    quý cuối tính là còn hiệu lực). Không có thì null. Nếu có nhiều dòng trùng quý (nhập tay ngoài form) lấy dòng ValidFrom mới nhất.
-- 3) get_course_rate(domain, prg, mã môn, quý): cho form xem trước. Loại môn lấy từ tbl_subject.obj_json.Type.
-- 4) create_course(...): tạo khóa. Số thứ tự lớp cấp ở SQL vì tbl_course.course_name KHÔNG unique ở mức DB
--    (tên khóa đã xóa mềm được dùng lại), nên đếm số ở trình duyệt rồi insert sẽ bị đua khi hai người tạo cùng lúc.
--    Hàm khóa tuần tự (advisory lock), tìm số nhỏ nhất chưa dùng và insert trong một giao dịch.
--    Quy tắc ĐẶT TÊN theo từng domain nằm ở app (data/transformers/courseRules.js); hàm chỉ nhận tên đã dựng:
--      p_numbered = true : p_name là TIỀN TỐ (vd 'BAP_Q426_T'), hàm nối số nhỏ nhất chưa có khóa đang dùng trùng tên (T1, T2, ...)
--      p_numbered = false: p_name là TÊN ĐẦY ĐỦ; trùng khóa đang dùng thì báo COURSE_DUPLICATED
--    Môn học kiểm tra ở DB theo (domain, prg, subj_code) đang dùng; cột subject lấy SubjName, Rate tra theo Type của môn và quý (không tin client).
--    start_date / end_date do app suy ra từ quý (ngày đầu / cuối quý) vì form không nhập ngày; các trang khác vẫn đọc 2 cột này.
-- Chỉ service_role gọi được các hàm.

alter table public.tbl_course add column if not exists rate numeric;

create or replace function public.find_rate(p_domain text, p_type text, p_quarter text)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select (m.obj_json ->> 'Rate')::numeric
    from public.tbl_misc m
   where nullif(btrim(p_type), '') is not null
     and m.cat = 'RATE'
     and (m.i_status is null or m.i_status = 0)
     and m.obj_json ->> 'Domain' = p_domain
     and m.obj_json ->> 'SubjectType' = p_type
     and (m.obj_json ->> 'ValidFrom') collate "C" <= p_quarter collate "C"
     and coalesce(nullif(m.obj_json ->> 'ValidThru', ''), '9999Q4') collate "C" >= p_quarter collate "C"
   order by (m.obj_json ->> 'ValidFrom') collate "C" desc
   limit 1;
$$;

create or replace function public.get_course_rate(p_domain text, p_prg text, p_subj_code text, p_quarter text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_type text;
begin
  if nullif(btrim(p_domain), '') is null or nullif(btrim(p_prg), '') is null
     or nullif(btrim(p_subj_code), '') is null or p_quarter !~ '^\d{4}Q[1-4]$' then
    raise exception 'INVALID_BODY';
  end if;

  select coalesce(s.obj_json ->> 'Type', '') into v_type
    from public.tbl_subject s
   where s.domain = p_domain and s.prg = p_prg and s.subj_code = p_subj_code
     and (s.i_status is null or s.i_status = 0);
  if not found then
    raise exception 'SUBJECT_NOT_FOUND';
  end if;

  return jsonb_build_object('subjectType', v_type, 'rate', public.find_rate(p_domain, v_type, p_quarter));
end;
$$;

-- Bản trước không có p_quarter: bỏ đi để không còn hai hàm cùng tên
drop function if exists public.create_course(text, text, text, text, boolean, real, date, date, jsonb, text);

create or replace function public.create_course(
  p_domain    text,
  p_prg       text,
  p_subj_code text,
  p_quarter   text,
  p_name      text,
  p_numbered  boolean,
  p_coef      real,
  p_start     date,
  p_end       date,
  p_lecturers jsonb,
  p_user      text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_subject text;
  v_type    text;
  v_rate    numeric;
  v_name    text;
  v_n       int := 1;
  v_id      bigint;
begin
  if nullif(btrim(p_name), '') is null or nullif(btrim(p_domain), '') is null
     or nullif(btrim(p_prg), '') is null or nullif(btrim(p_subj_code), '') is null
     or p_quarter is null or p_quarter !~ '^\d{4}Q[1-4]$'
     or p_coef is null or p_coef <= 0
     or p_start is null or p_end is null or p_end < p_start
     or jsonb_typeof(p_lecturers) is distinct from 'array' then
    raise exception 'INVALID_BODY';
  end if;

  select coalesce(s.obj_json ->> 'SubjName', ''), coalesce(s.obj_json ->> 'Type', '') into v_subject, v_type
    from public.tbl_subject s
   where s.domain = p_domain and s.prg = p_prg and s.subj_code = p_subj_code
     and (s.i_status is null or s.i_status = 0);
  if not found then
    raise exception 'SUBJECT_NOT_FOUND';
  end if;

  -- Tạo khóa hiếm khi xảy ra, nên dùng một khóa chung cho đơn giản và chắc chắn
  perform pg_advisory_xact_lock(hashtext('tbl_course.create'));

  v_rate := public.find_rate(p_domain, v_type, p_quarter); -- null nếu chưa có Rate hiệu lực cho loại môn này ở quý đó

  if p_numbered then
    loop
      v_name := p_name || v_n::text;
      exit when not exists (select 1 from public.tbl_course c where c.course_name = v_name and c.i_status = 0);
      v_n := v_n + 1;
      if v_n > 999 then raise exception 'COURSE_NAME_EXHAUSTED'; end if;
    end loop;
  else
    v_name := p_name;
    if exists (select 1 from public.tbl_course c where c.course_name = v_name and c.i_status = 0) then
      raise exception 'COURSE_DUPLICATED';
    end if;
  end if;

  insert into public.tbl_course
    (course_name, subject, coef, rate, start_date, end_date, obj_lecturer, i_status, created_by, created_at, updated_at)
  values
    (v_name, v_subject, p_coef, v_rate, p_start, p_end, p_lecturers, 0, p_user, now(), now())
  returning id into v_id;

  return jsonb_build_object('id', v_id, 'courseName', v_name, 'rate', v_rate);
end;
$$;

revoke all on function public.find_rate(text, text, text)                                                   from public, anon, authenticated;
revoke all on function public.get_course_rate(text, text, text, text)                                       from public, anon, authenticated;
revoke all on function public.create_course(text, text, text, text, text, boolean, real, date, date, jsonb, text) from public, anon, authenticated;
grant execute on function public.find_rate(text, text, text)                                                to service_role;
grant execute on function public.get_course_rate(text, text, text, text)                                    to service_role;
grant execute on function public.create_course(text, text, text, text, text, boolean, real, date, date, jsonb, text) to service_role;
