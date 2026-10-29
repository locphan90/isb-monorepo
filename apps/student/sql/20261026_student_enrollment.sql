-- Đăng ký khóa học + lịch học của sinh viên (app sinh viên: Enrollment, Schedule)
--
-- Cần có sẵn: tbl_course, tbl_student, tbl_misc, tbl_course_schedule (file apps/staff/sql/20261025_course_schedule.sql)
-- và hàm get_student_self(p_email) (dùng chung cách tìm sinh viên theo email với trang Profile).
--
-- Khóa nào được hiện cho sinh viên đăng ký: khóa còn hiệu lực (i_status = 0, chưa kết thúc theo giờ Việt Nam)
-- VÀ khớp một môn trong obj_json.RequiredSubjects của sinh viên ({ "<mã môn>": true }). Một khóa "khớp" môn khi
--   - tên khóa bắt đầu bằng "<mã môn>_Q" (course_name = <subj_code>_<quý>_<lớp>), hoặc
--   - tbl_course.subject trùng tên môn trong danh sách Required Subjects (tbl_misc SUBJECTS / REQUIRED_LIST).
-- Sinh viên đã đăng ký thì không đăng ký lại cùng khóa (chỉ mục unique). Mọi hàm chỉ gọi được từ server (service_role).

create table if not exists public.tbl_course_enrollment (
  id           bigint generated always as identity primary key,
  course_id    bigint      not null references public.tbl_course (id),
  mssv         text        not null,
  i_status     smallint    not null default 0,   -- 0 = đang đăng ký, 1 = đã hủy (xóa mềm)
  created_by   character varying,
  created_at   timestamp with time zone not null default now(),
  updated_by   character varying,
  updated_at   timestamp with time zone not null default now()
);

create unique index if not exists uq_course_enrollment on public.tbl_course_enrollment (course_id, mssv) where i_status = 0;
create index if not exists ix_course_enrollment_mssv   on public.tbl_course_enrollment (mssv) where i_status = 0;

alter table public.tbl_course_enrollment enable row level security;
revoke all on table public.tbl_course_enrollment from anon, authenticated;
grant select, insert, update, delete on table public.tbl_course_enrollment to service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- Nội bộ: sinh viên (theo email) -> mssv + các môn bắt buộc đã chuẩn hóa { mssv, codes[], names[] }
create or replace function public.student_enrollment_context(p_email text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_mssv  text;
  v_req   jsonb;
  v_codes text[];
  v_names text[];
begin
  v_mssv := public.get_student_self(p_email) ->> 'mssv';
  if v_mssv is null then
    raise exception 'EMAIL_NOT_REGISTERED';
  end if;

  select s.obj_json -> 'RequiredSubjects' into v_req
    from public.tbl_student s
   where s.mssv = v_mssv and s.i_status = 0;
  if not found then
    raise exception 'EMAIL_NOT_REGISTERED';
  end if;
  if jsonb_typeof(v_req) is distinct from 'object' then
    v_req := '{}'::jsonb;
  end if;

  select coalesce(array_agg(r.key), '{}'::text[]) into v_codes
    from jsonb_each(v_req) r
   where r.value = 'true'::jsonb;

  -- tên môn của các mã đó trong danh sách Required Subjects (để khớp với tbl_course.subject)
  select coalesce(array_agg(lower(btrim(x ->> 'name'))) filter (where nullif(btrim(x ->> 'name'), '') is not null), '{}'::text[])
    into v_names
    from public.tbl_misc m
    cross join lateral jsonb_array_elements(
      case when jsonb_typeof(m.arr_json -> 'subjects') = 'array' then m.arr_json -> 'subjects' else '[]'::jsonb end
    ) x
   where m.cat = 'SUBJECTS' and m.val = 'REQUIRED_LIST'
     and (x ->> 'code') = any (v_codes);

  return jsonb_build_object('mssv', v_mssv, 'codes', to_jsonb(v_codes), 'names', to_jsonb(v_names));
end;
$$;

-- Nội bộ: khóa có khớp các môn bắt buộc không
create or replace function public.course_matches_required(p_course_name text, p_subject text, p_codes text[], p_names text[])
returns boolean
language sql
immutable
as $$
  select exists (
           select 1 from unnest(coalesce(p_codes, '{}'::text[])) k
            where left(p_course_name, length(k) + 2) = k || '_Q'
         )
      or (nullif(btrim(p_subject), '') is not null and lower(btrim(p_subject)) = any (coalesce(p_names, '{}'::text[])));
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Danh sách khóa cho trang Enrollment: các khóa còn hiệu lực khớp môn bắt buộc, cộng các khóa đã đăng ký (còn hiệu lực)
-- => { today, requiredCount, courses: [{ id, courseName, subject, startDate, endDate, status, enrolled, sessionCount }] }
create or replace function public.get_student_enrollment(p_email text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_ctx   jsonb := public.student_enrollment_context(p_email);
  v_mssv  text  := v_ctx ->> 'mssv';
  v_codes text[] := array(select jsonb_array_elements_text(v_ctx -> 'codes'));
  v_names text[] := array(select jsonb_array_elements_text(v_ctx -> 'names'));
  v_today date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
begin
  return jsonb_build_object(
    'today', to_char(v_today, 'YYYY-MM-DD'),
    'requiredCount', coalesce(array_length(v_codes, 1), 0),
    'courses', coalesce((
      select jsonb_agg(
               jsonb_build_object(
                 'id',           q.id,
                 'courseName',   q.course_name,
                 'subject',      q.subject,
                 'startDate',    to_char(q.start_date, 'YYYY-MM-DD'),
                 'endDate',      to_char(q.end_date, 'YYYY-MM-DD'),
                 'status',       case when q.start_date > v_today then 'upcoming' else 'running' end,
                 'enrolled',     q.enrolled,
                 'sessionCount', q.session_count
               )
               order by q.start_date, q.course_name, q.id
             )
        from (
          select c.id, c.course_name, c.subject, c.start_date, c.end_date,
                 (e.id is not null) as enrolled,
                 (select count(*) from public.tbl_course_schedule s where s.course_id = c.id and s.i_status = 0) as session_count
            from public.tbl_course c
            left join public.tbl_course_enrollment e
                   on e.course_id = c.id and e.mssv = v_mssv and e.i_status = 0
           where c.i_status = 0
             and c.end_date >= v_today
             and (e.id is not null or public.course_matches_required(c.course_name, c.subject, v_codes, v_names))
        ) q
    ), '[]'::jsonb)
  );
end;
$$;

-- Đăng ký một khóa. Lỗi: COURSE_NOT_FOUND (không còn hiệu lực), ALREADY_ENROLLED, NOT_ELIGIBLE (không khớp môn bắt buộc)
create or replace function public.enroll_student_course(p_email text, p_course_id bigint, p_user text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ctx    jsonb := public.student_enrollment_context(p_email);
  v_mssv   text  := v_ctx ->> 'mssv';
  v_codes  text[] := array(select jsonb_array_elements_text(v_ctx -> 'codes'));
  v_names  text[] := array(select jsonb_array_elements_text(v_ctx -> 'names'));
  v_today  date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  v_course public.tbl_course%rowtype;
begin
  if p_course_id is null then
    raise exception 'INVALID_BODY';
  end if;

  -- Hai lần bấm gần như đồng thời của cùng một sinh viên cho cùng một khóa chạy lần lượt
  perform pg_advisory_xact_lock(hashtext('enroll:' || p_course_id::text || ':' || v_mssv));

  select * into v_course
    from public.tbl_course c
   where c.id = p_course_id and c.i_status = 0 and c.end_date >= v_today;
  if not found then
    raise exception 'COURSE_NOT_FOUND';
  end if;

  if exists (select 1 from public.tbl_course_enrollment e where e.course_id = p_course_id and e.mssv = v_mssv and e.i_status = 0) then
    raise exception 'ALREADY_ENROLLED';
  end if;

  if not public.course_matches_required(v_course.course_name, v_course.subject, v_codes, v_names) then
    raise exception 'NOT_ELIGIBLE';
  end if;

  insert into public.tbl_course_enrollment (course_id, mssv, created_by, updated_by)
  values (p_course_id, v_mssv, coalesce(p_user, p_email), coalesce(p_user, p_email));

  return jsonb_build_object('courseId', p_course_id, 'enrolled', true);
exception
  when unique_violation then
    raise exception 'ALREADY_ENROLLED';
end;
$$;

-- Lịch của sinh viên trong khoảng ngày [p_from, p_to] (chỉ các khóa đang đăng ký)
-- => [{ courseId, courseName, subject, date, start, end, room, lecturerName, note }]
create or replace function public.get_student_schedule(p_email text, p_from date, p_to date)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_mssv text := public.student_enrollment_context(p_email) ->> 'mssv';
begin
  if p_from is null or p_to is null or p_to < p_from then
    raise exception 'INVALID_VALUE';
  end if;

  return coalesce((
    select jsonb_agg(
             jsonb_build_object(
               'courseId',     c.id,
               'courseName',   c.course_name,
               'subject',      c.subject,
               'date',         to_char(s.session_date, 'YYYY-MM-DD'),
               'start',        to_char(s.start_time, 'HH24:MI'),
               'end',          to_char(s.end_time, 'HH24:MI'),
               'room',         s.room,
               'lecturerName', s.lecturer_name,
               'note',         s.note
             )
             order by s.session_date, s.start_time nulls last, c.course_name, s.id
           )
      from public.tbl_course_enrollment e
      join public.tbl_course c on c.id = e.course_id and c.i_status = 0
      join public.tbl_course_schedule s on s.course_id = c.id and s.i_status = 0
     where e.mssv = v_mssv and e.i_status = 0
       and s.session_date between p_from and p_to
  ), '[]'::jsonb);
end;
$$;

-- Toàn bộ lịch của MỘT khóa sinh viên đang đăng ký. Lỗi NOT_ENROLLED nếu sinh viên không đăng ký khóa này.
-- => { course: { id, courseName, subject, startDate, endDate }, sessions: [{ date, start, end, room, lecturerName, note }] }
create or replace function public.get_student_course_schedule(p_email text, p_course_id bigint)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_mssv   text := public.student_enrollment_context(p_email) ->> 'mssv';
  v_course public.tbl_course%rowtype;
begin
  select c.* into v_course
    from public.tbl_course c
    join public.tbl_course_enrollment e on e.course_id = c.id and e.mssv = v_mssv and e.i_status = 0
   where c.id = p_course_id and c.i_status = 0;
  if not found then
    raise exception 'NOT_ENROLLED';
  end if;

  return jsonb_build_object(
    'course', jsonb_build_object(
      'id', v_course.id,
      'courseName', v_course.course_name,
      'subject', v_course.subject,
      'startDate', to_char(v_course.start_date, 'YYYY-MM-DD'),
      'endDate', to_char(v_course.end_date, 'YYYY-MM-DD')
    ),
    'sessions', coalesce((
      select jsonb_agg(
               jsonb_build_object(
                 'date',         to_char(s.session_date, 'YYYY-MM-DD'),
                 'start',        to_char(s.start_time, 'HH24:MI'),
                 'end',          to_char(s.end_time, 'HH24:MI'),
                 'room',         s.room,
                 'lecturerName', s.lecturer_name,
                 'note',         s.note
               )
               order by s.session_date, s.start_time nulls last, s.id
             )
        from public.tbl_course_schedule s
       where s.course_id = v_course.id and s.i_status = 0
    ), '[]'::jsonb)
  );
end;
$$;

-- Quyền: chỉ service_role (server của app sinh viên)
revoke all on function public.student_enrollment_context(text)                           from public, anon, authenticated;
revoke all on function public.course_matches_required(text, text, text[], text[])        from public, anon, authenticated;
revoke all on function public.get_student_enrollment(text)                               from public, anon, authenticated;
revoke all on function public.enroll_student_course(text, bigint, text)                  from public, anon, authenticated;
revoke all on function public.get_student_schedule(text, date, date)                     from public, anon, authenticated;
revoke all on function public.get_student_course_schedule(text, bigint)                  from public, anon, authenticated;
grant execute on function public.student_enrollment_context(text)                        to service_role;
grant execute on function public.course_matches_required(text, text, text[], text[])     to service_role;
grant execute on function public.get_student_enrollment(text)                            to service_role;
grant execute on function public.enroll_student_course(text, bigint, text)               to service_role;
grant execute on function public.get_student_schedule(text, date, date)                  to service_role;
grant execute on function public.get_student_course_schedule(text, bigint)               to service_role;
