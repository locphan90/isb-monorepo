# @isb/core

Nuxt layer dùng chung cho `apps/staff` và `apps/student`.

- Trong layer, `~/` luôn trỏ về **app đang chạy**, không phải layer. File trong `packages/core` chỉ import bằng đường dẫn tương đối.
- App import file của core bằng alias `#core/...`, ví dụ `#core/data/schemas/studentSelfEdit`.
- Chỉ đưa vào core thứ **cả hai app cùng cần**. Code chỉ một bên dùng thì để trong app đó.
