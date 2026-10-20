<template>
  <!-- Fixed A4 Document Sheet -->
  <div 
    class="bg-white text-gray-900 shadow-2xl mx-auto relative box-border text-left leading-relaxed select-none overflow-hidden"
    style="width: 794px; min-height: 1123px; padding: 70px 80px; background-color: #ffffff; color: #111827; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); margin-left: auto; margin-right: auto; font-family: 'Times New Roman', Times, serif; position: relative; box-sizing: border-box; text-align: left; line-height: 1.625; user-select: none; overflow: hidden;"
  >
    <!-- Header Section -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; font-size: 16px; color: #111827;">
      
      <!-- Left Header Column -->
      <div style="text-align: center; width: 48%;">
        <p style="text-transform: uppercase; font-weight: normal; margin: 0; white-space: nowrap;">Đại Học Kinh Tế TP. Hồ Chí Minh</p>
        <p style="text-transform: uppercase; font-weight: 700; margin: 4px 0 0 0; white-space: nowrap;">Viện Đào Tạo Quốc Tế</p>
        <div style="width: 180px; height: 1.5px; background-color: #000000; margin: 8px auto 0 auto;"></div>
      </div>

      <!-- Right Header Column -->
      <div style="text-align: center; width: 50%;">
        <p style="text-transform: uppercase; font-weight: 700; margin: 0; white-space: nowrap;">Cộng Hoà Xã Hội Chủ Nghĩa Việt Nam</p>
        <p style="font-weight: 700; margin: 4px 0 0 0; white-space: nowrap;">Độc lập - Tự do - Hạnh phúc</p>
        <div style="width: 180px; height: 1.5px; background-color: #000000; margin: 8px auto 0 auto;"></div>
        <p style="font-size: 15px; font-style: italic; margin-top: 12px; color: #1f2937; white-space: nowrap;">
          Thành phố Hồ Chí Minh, ngày {{ currentDate[0] }} tháng {{ currentDate[1] }} năm {{ currentDate[2] }}
        </p>
      </div>


    </div>

    <!-- Title Section -->
    <div style="text-align: center; margin: 40px 0;">
      <h1 style="font-size: 22px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #111827; margin: 0;">
        Giấy Xác Nhận
      </h1>
    </div>

    <!-- Description Paragraph -->
    <p style="text-align: justify; font-size: 17px; margin-bottom: 40px; color: #111827; line-height: 1.6;">
      Viện Đào tạo quốc tế xác nhận:
    </p>

    <!-- Student Details Grid -->
    <div style="display: grid; grid-template-columns: 160px 1fr 160px 1fr; row-gap: 12px; column-gap: 16px; font-size: 17px; margin-bottom: 2cqmax; padding-left: 8px; align-items: center;">
      <!-- Row 1: Full Width Name -->
      <div style="color: #111827;">Họ và tên:</div>
      <div style="font-weight: 700; color: #111827; font-size: 16px; grid-column: span 3;">{{ student?.FullName }}</div>

      <!-- Row 2 -->
      <div style="color: #111827;">Ngày sinh:</div>
      <div style="color: #111827;">{{ student?.DOB }}</div>

      <div style="color: #111827;">Mã số sinh viên:</div>
      <div style="color: #111827;">{{ student?.MSSV }}</div>

      <!-- Row 3 -->
      <div style="color: #111827;"> {{ student?.QT=='VN' ? 'Số CCCD:' : 'Số hộ chiếu:'}} </div>
      <div style="color: #111827;">{{ student?.CCCD }}</div>

      <div style="color: #111827;">Ngày cấp:</div>
      <div style="color: #111827;">{{ student?.CCCDDate }}</div>

      <!-- Row 4 -->
      <div style="color: #111827;">Niên khoá:</div>
      <div style="color: #111827;">{{ cohort }}</div>

      <div style="color: #111827;">Hệ đào tạo:</div>
      <div style="color: #111827;">Chính quy</div>
    </div>

    <p style="text-align: justify; font-size: 17px; margin-bottom: 20px; color: #111827; line-height: 1.6;">
      Là sinh viên chương trình Cử nhân {{ prg }} liên kết đào tạo giữa Viện Đào tạo quốc tế - Đại học Kinh tế Thành phố Hồ Chí Minh 
      và Đại học Western Sydney (Úc). Chương trình được đào tạo hoàn toàn bằng tiếng Anh.
    </p>
    <p style="text-align: justify; font-size: 17px; margin-bottom: 20px; color: #111827; line-height: 1.6;" v-if="mucdich!=''">
      {{ mucdich }}
    </p>
    
    <!-- Signature Block -->
    <div style="display: flex; justify-content: flex-end; margin-top: 32px; padding-right: 16px;">
      <div style="text-align: center; width: 240px;">
        <p style="font-weight: 700; font-size: 16px; text-transform: uppercase; margin-bottom: 96px; letter-spacing: 0.05em; color: #111827;">
          Giám đốc Điều hành
        </p>
        <p style="font-weight: 700; font-size: 16px; color: #111827; margin: 0;">
          TS. Phan Thị Minh Thư
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CN_XacNhanSV',
  props: {
    student: {
      type: Object,
      default: () => ({})
    },
    templateName: {
      type: String,
      default: 'XinHoanNVQS'
    }

  },
  computed: {
    currentDate() {
      const today = new Date()
      
      // Days < 10 get a leading zero
      const day = String(today.getDate()).padStart(2, '0')
      
      // Months 1 & 2 get a leading zero; Month 3+ does NOT
      const m = today.getMonth() + 1
      const month = (m < 3) ? String(m).padStart(2, '0') : String(m)
      
      const year = today.getFullYear()

      return [day, month, year]
    },
      
    cohort() {
      const namhoc = this.student.MSSV.substring(0,2)
      return `20${namhoc}-20${Number(namhoc)+4}`
    },
    ThoiGianHoanThanh() {
      if (!this.student.KyCuoiDuKien) return ''
      const Thang = this.student.KyCuoiDuKien.includes('T1') ? '4' : this.student.KyCuoiDuKien.includes('T2') ? '8' : '12'
      return `tháng ${Thang} năm ${this.student.KyCuoiDuKien.substring(0,4)}`
    },

    prg() {
      let KQ = 'Khoa học dữ liệu ứng dung'
      if (this.student?.PRG=='BBUS') {KQ = 'Kinh doanh'}
      if (this.student?.PRG=='BCOMM') {KQ = 'Truyền thông'}
      return KQ
    },
    mucdich() {
      let KQ 
      if (this.templateName=='XinHoanNVQS') {KQ = 'Giấy chứng nhận này được cấp theo yêu cầu của sinh viên để phục vụ việc hoàn thiện hồ sơ xin tạm hoãn thực hiện nghĩa vụ quân sự.'}
      if (this.templateName=='XNSVXinThucTap') {KQ = 'Giấy chứng nhận này được cấp theo yêu cầu của sinh viên để phục vụ việc hoàn thiện hồ sơ xin thực tập tại doanh nghiệp.'}
      if (this.templateName=='XNSVHocKyCuoi') {KQ = `Sinh viên hiện đang học kỳ cuối cùng, dự kiến hoàn thành chương trình đào tạo vào ${this.ThoiGianHoanThanh}.`}
      if (!KQ) return ''      
      return ` ${KQ}`
    }

  }
}
</script>