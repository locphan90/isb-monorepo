-- 20261113_lock_course_subject.sql  (chạy trong Supabase SQL Editor; chạy lại nhiều lần được)
--
-- CHẠY SAU KHI ĐÃ DEPLOY code mới (trình duyệt staff không còn dùng anon key cho: tbl_subject, tbl_course,
-- và dòng cat = 'SUBJECTS' của tbl_misc). Chạy trước khi deploy sẽ làm hỏng Create Course, Course Schedule,
-- Required Subjects và form Add/Edit sinh viên.
--
-- Việc làm:
--   1) tbl_course, tbl_subject: bật RLS, xóa mọi policy, thu mọi quyền của anon / authenticated / public (kể cả sequence).
--      service_role và các hàm SECURITY DEFINER (create_course, list_subjects, ...) không bị ảnh hưởng.
--   2) tbl_misc: thêm policy RESTRICTIVE chặn dòng cat = 'SUBJECTS' với anon / authenticated. Policy RESTRICTIVE được
--      AND với mọi policy cũ nên không phụ thuộc thứ tự chạy với 20261106 / 20261110 / 20261111 (không đụng policy của các file đó).
--
-- Hoàn tác (nếu cần quay lại tạm thời):
--   drop policy "block SUBJECTS rows for browser" on public.tbl_misc;
--   grant select, insert on public.tbl_course to anon;  -- và policy tương ứng nếu muốn như cũ
--   grant select on public.tbl_subject to anon;

begin;

do $$
declare
  t text;
  r record;
  seq text;
begin
  foreach t in array array['tbl_course', 'tbl_subject'] loop
    if to_regclass('public.' || t) is null then
      raise notice 'Bảng public.% không tồn tại, bỏ qua', t;
      continue;
    end if;

    execute format('alter table public.%I enable row level security', t);

    for r in select policyname from pg_policies where schemaname = 'public' and tablename = t loop
      execute format('drop policy %I on public.%I', r.policyname, t);
    end loop;

    execute format('revoke all on table public.%I from anon, authenticated, public', t);
    execute format('grant all on table public.%I to service_role', t);

    seq := pg_get_serial_sequence('public.' || t, 'id');
    if seq is not null then
      execute format('revoke all on sequence %s from anon, authenticated, public', seq);
      execute format('grant all on sequence %s to service_role', seq);
    end if;
  end loop;
end $$;

alter table public.tbl_misc enable row level security;

drop policy if exists "block SUBJECTS rows for browser" on public.tbl_misc;
create policy "block SUBJECTS rows for browser" on public.tbl_misc
  as restrictive
  for all
  to anon, authenticated
  using (cat is distinct from 'SUBJECTS')
  with check (cat is distinct from 'SUBJECTS');

commit;

-- Kiểm tra sau khi chạy (thay $URL / $ANON): cả 3 lệnh phải báo lỗi permission denied hoặc trả mảng rỗng [].
--   curl "$URL/rest/v1/tbl_subject?select=subj_code&limit=1" -H "apikey: $ANON" -H "Authorization: Bearer $ANON"
--   curl "$URL/rest/v1/tbl_course?select=course_name&limit=1" -H "apikey: $ANON" -H "Authorization: Bearer $ANON"
--   curl "$URL/rest/v1/tbl_misc?select=id&cat=eq.SUBJECTS" -H "apikey: $ANON" -H "Authorization: Bearer $ANON"
