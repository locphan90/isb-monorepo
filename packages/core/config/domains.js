// packages/core/config/domains.js
// Folder Google Drive theo domain. DÙNG CHUNG cho app staff (utils/globals.js -> arrDomain[].folderId)
// và app sinh viên (server). Chỉ chứa ID thư mục, KHÔNG để mật khẩu/token ở đây vì file này nằm trong bundle của cả hai app.
//   SA / AD / REG / AA : thư mục các phòng ban (staff upload vào đây)
export const domainFolders = {
  EAP: { SA: '1MfedU-t9fhjXFhcvZvpccJ-CoMy30vWJ', AD: '15yXj1jjuniYWXMi-_Yl7TUTJtpxfGTg1', REG: '1JKxlr7u1Lf5GpcrRK345V3ndaHLayo_d', AA: '1s9eWs4ILCaTAXIwde675CJ9ociQNPJNM', StudentDoc: '1JKxlr7u1Lf5GpcrRK345V3ndaHLayo_d' },
  ISP: { SA: '1dbbkafxcX53Gs3JM8eQgHNjqou3wpQkc', AD: '18HWa3nvsnlIRRxduxNyKpdea-0p7vobI', REG: '18xZzUmi84sjctfHcPumMK-mJXd_Ymyqo', AA: '1rFqLiuXUUTIrZh4qSFb7uNDMoKGyFfzN', StudentDoc: '' },
  WSU: { SA: '', AD: '', REG: '', AA: '', StudentDoc: '' },
  MBA: { SA: '1qbHZrYO7X-Iyh-3VXMCkcX_lWaPD_2GM', AD: '1FCkj3KGwWdRSZhHz61CzxnSZydSknYyv', REG: '1_tZGWeUPVk1CZOL-OHsZ6ZxkS32QiRDD', AA: '1j6_coGE_IAq_GIkG7bx2vKA9T-33BCW1', StudentDoc: '1kIlDVZS-V67ZmSORUt4iMt5uTAJOM1Fd' },
}
