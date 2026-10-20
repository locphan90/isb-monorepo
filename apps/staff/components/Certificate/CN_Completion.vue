<template>
  <!-- Fixed A4 Document Sheet -->
  <div 
    class="bg-white text-gray-900 shadow-2xl mx-auto relative box-border text-left leading-relaxed select-none overflow-hidden"
    style="width: 794px; min-height: 1123px; padding: 70px 80px; background-color: #ffffff; color: #111827; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); margin-left: auto; margin-right: auto; font-family: 'Times New Roman', Times, serif; position: relative; box-sizing: border-box; text-align: left; line-height: 1.625; user-select: none; overflow: hidden;"
  >
    <!-- Header Section -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; font-size: 13px; color: #111827;">
      
      <!-- Left Header Column -->
      <div style="text-align: center; width: 48%;">
        <p style="text-transform: uppercase; font-weight: 600; margin: 0; white-space: nowrap;">University of Economics Ho Chi Minh City</p>
        <p style="text-transform: uppercase; font-weight: 700; margin: 4px 0 0 0; white-space: nowrap;">ISB International Education Institute</p>
        <div style="width: 160px; height: 1px; background-color: #000000; margin: 8px auto 0 auto;"></div>
      </div>

      <!-- Right Header Column -->
      <div style="text-align: center; width: 50%;">
        <p style="text-transform: uppercase; font-weight: 700; margin: 0; white-space: nowrap;">The Socialist Republic of Vietnam</p>
        <p style="font-weight: 800; margin: 4px 0 0 0; white-space: nowrap;">Independence - Freedom - Happiness</p>
        <div style="width: 180px; height: 1px; background-color: #000000; margin: 8px auto 0 auto;"></div>
        <p style="text-align: right; font-size: 17px; font-style: italic; margin-top: 12px; color: #1f2937;">
          Ho Chi Minh City, {{ currentDate }}
        </p>
      </div>

    </div>
    <!-- Title Section -->
    <div style="text-align: center; margin: 40px 0;">
      <h1 style="font-size: 24px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #111827; margin: 0;">
        Certificate of Course Completion
      </h1>
    </div>

    <!-- Description Paragraph -->
    <p style="text-align: justify; font-size: 17px; margin-bottom: 20px; color: #111827; line-height: 1.6;">
      This is to certify that the student whose details appear below has sucessfully completed all subjects of the
      Bachelor of {{ prg }} program, a joint program between ISB International Education Institute - University of Economics Ho Chi Minh City and
      Western Sydney University (Australia). This course is delivered entirely in English.
    </p>
    <!-- Student Details Grid -->
    <div style="display: grid; grid-template-columns: max-content 1fr max-content 1fr; row-gap: 12px; column-gap: 16px; font-size: 17px; margin-bottom: 10px; padding-left: 8px; align-items: center;">
      
      <!-- Row 1: Full Name Spans Across -->
      <div style="color: #111827;">Full name:</div>
      <div style="color: #111827; grid-column: span 3;">{{ student?.FullName }}</div>

      <!-- Row 2 -->
      <div style="color: #111827;">Date of birth:</div>
      <div style="color: #111827;">{{ student?.DOB }}</div>

      <div style="color: #111827;">Student ID (Stage 1):</div>
      <div style="color: #111827;">{{ student?.MSSV }}</div>

      <!-- Row 3 -->
      <div style="color: #111827;">Student ID (Stage 2):</div>
      <div style="color: #111827;">{{ student?.StdtID }}</div>

      <div style="color: #111827;">ID Card No.:</div>
      <div style="color: #111827;">{{ student?.CCCD }}</div>

      <!-- Row 4 -->
      <div style="color: #111827;">Date of issue:</div>
      <div style="color: #111827;">{{ student?.CCCDDate }}</div>

      <div style="color: #111827;">Cohort:</div>
      <div style="color: #111827;">{{ cohort }}</div>

      <!-- Row 5: Mode of study at the end -->
      <div style="color: #111827;">Mode of study:</div>
      <div style="color: #111827;">Full time</div>
    </div>




    <!-- Sub-note -->
    <p style="font-size: 17px !important; font-style: italic; color: #111827; margin-bottom: 32px; padding-left: 8px;">
      
    </p>    

    <!-- Signature Block -->
    <div style="display: flex; justify-content: flex-end; margin-top: 32px; padding-right: 17px;">
      <div style="text-align: center; width: 240px;">
        <p style="font-weight: 700; font-size: 17px; text-transform: uppercase; margin-bottom: 96px; letter-spacing: 0.05em; color: #111827;">
          Executive Director
        </p>
        <p style="font-weight: 700; font-size: 17px; color: #111827; margin: 0;">
          Dr. Phan Thi Minh Thu
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CN_Completion',
  props: {
    student: {
      type: Object,
      default: () => ({})
    },
  },
  computed: {
    currentDate() {
      const today = new Date()
      return today.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    },
    cohort() {
      const namhoc = this.student.MSSV.substring(0,2)
      return `20${namhoc}-20${Number(namhoc)+4}`
    },
    prg() {
      let KQ = 'Applied Data Science'
      if (this.student?.PRG=='BBUS') {KQ = 'Business'}
      if (this.student?.PRG=='BCOMM') {KQ = 'Communication'}
      return KQ
    },

  }
}
</script>