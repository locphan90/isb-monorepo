<template>
  <!-- Fixed A4 Document Sheet -->
  <div 
    class="bg-white text-gray-900 shadow-2xl mx-auto relative box-border text-left leading-relaxed select-none overflow-hidden"
    style="width: 794px; min-height: 1123px; padding: 50px 60px; background-color: #ffffff; color: #111827; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); margin-left: auto; margin-right: auto; font-family: 'Times New Roman', Times, serif; position: relative; box-sizing: border-box; text-align: left; line-height: 1.5; user-select: none; overflow: hidden;"
  >
    <!-- Header Section -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; font-size: 14px; color: #111827;">
      
      <!-- Left Header Column -->
      <div style="text-align: left; width: 50%;">
        <p style="text-transform: uppercase; font-weight: 700; margin: 0; white-space: nowrap;">ĐẠI HỌC KINH TẾ TP. HCM</p>
        <p style="text-transform: uppercase; font-weight: 700; margin: 2px 0 0 0; white-space: nowrap;">VIỆN ĐÀO TẠO QUỐC TẾ</p>
      </div>

      <!-- Right Header Column -->
      <div style="text-align: right; width: 50%;">
        <p style="font-weight: normal; margin: 0; white-space: nowrap;">Mẫu: ĐNTT-2025/01</p>
      </div>

    </div>

    <!-- Title Section -->
    <div style="text-align: center; margin: 20px 0 10px 0;">
      <h1 style="font-size: 22px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #111827; margin: 0;">
        ĐỀ NGHỊ THANH TOÁN
      </h1>
      <p style="text-align: center; font-size: 14px; font-style: italic; margin-top: 6px; color: #1f2937;">
        TP. HCM, ngày {{ currentDate[0] }} tháng {{ currentDate[1] }} năm {{ currentDate[2] }}
      </p>
    </div>

    <!-- Receiver & Requester Info Section -->
    <div style="font-size: 15px; margin-bottom: 16px; line-height: 1.6;">
        <p style="font-weight: 700; margin: 0 0 6px 0;">
            Kính gửi: <span style="font-weight: normal;">Ban Lãnh đạo Viện Đào tạo Quốc tế</span>
        </p>

        <div style="display: flex; gap: 32px; font-size: 15px; white-space: nowrap;">
        <div><strong>Người đề nghị:</strong> {{ paymentData?.NguoiDN }}</div>
        <div><strong>Bộ phận:</strong> {{ tenBP }}</div>
        </div>
    </div>

    <!-- Section 1: Payment Content -->
    <div style="font-size: 15px; margin-bottom: 16px;">
      <p style="font-weight: 700; margin: 0 0 4px 0;">1. Nội dung thanh toán: </p>
      <div style="margin-left: 16px; margin-bottom: 6px;">{{ paymentData?.NDTT }}</div>
      <div style="display: flex; gap: 24px; margin-left: 16px; font-size: 14px;">
        <div><strong>MMC:</strong> {{ paymentData?.MMC }}</div>
        <div><strong>Mã công trình:</strong> {{ paymentData?.PRJ }}</div>
        <div><strong>Kỳ chi:</strong> {{ paymentData?.Term }}</div>
        <div><strong>Tháng chi:</strong> {{ paymentData?.Thang }}</div>
      </div>
    </div>

    <!-- Section 3: Forms / Options (Checkboxes) -->
    <div style="font-size: 15px; margin-bottom: 16px;">
    <p style="font-weight: 700; margin: 0 0 6px 0;">3. Hình thức:</p>
    
    <div style="display: flex; flex-direction: column; gap: 6px; margin-left: 16px;">
        <!-- 1. Thanh toán -->
        <div style="display: flex; align-items: baseline;">
        <span style="font-family: monospace; font-size: 16px; margin-right: 8px;">
            {{ (paymentData?.RQType.includes('01') || paymentData?.RQType.includes('08')) ? '☑' : '☐' }}
        </span>
        <span>Thanh toán</span>
        </div>

        <!-- 2. Chi hộ -->
        <div style="display: flex; align-items: baseline;">
        <span style="font-family: monospace; font-size: 16px; margin-right: 8px;">
            {{ paymentData?.RQType.includes('03')  ? '☑' : '☐' }}
        </span>
        <span>Chi hộ (thông tin nguồn chi hộ): {{ paymentData?.Nguon }}</span>
        </div>

        <!-- 3. Hoàn ứng -->
        <div style="display: flex; align-items: baseline;">
        <span style="font-family: monospace; font-size: 16px; margin-right: 8px;">
            {{ paymentData?.RQType.includes('10')  ? '☑' : '☐' }}
        </span>
        <span>Hoàn ứng, đính kèm bảng kê hoàn ứng</span>
        </div>

        <!-- 4. Thanh toán chung nhiều bộ phận -->
        <div style="display: flex; align-items: baseline;">
        <span style="font-family: monospace; font-size: 16px; margin-right: 8px;">
            {{ paymentData?.RQType.includes('09')  ? '☑' : '☐' }}
        </span>
        <span>Thanh toán chung nhiều bộ phận: đính kèm bảng phân bổ từng bộ phận</span>
        </div>
    </div>
    </div>


    <!-- Section 4: Amount -->
    <div style="font-size: 15px; margin-bottom: 16px; line-height: 1.6;">
      <p style="font-weight: 700; margin: 0 0 4px 0;">
        4. Số tiền đề nghị thanh toán: <span style="font-weight: 700; font-size: 16px;">{{ formattedAmount }}</span>
      </p>
      <p style="margin: 0 0 6px 0;"><strong>Bằng chữ:</strong> {{SoRaChu(paymentData?.Amount) }}</p>
      
      <!-- Foreign Currency Block (Optional Display) -->
      <div v-if="paymentData?.Curr!='VND'" style="margin-top: 6px; padding-left: 16px; font-style: italic; color: #374151;">
        <p style="margin: 0;">Trường hợp thanh toán bằng ngoại tệ, kế toán nhập thông tin dưới đây:</p>
        <p style="margin: 2px 0 0 0;">Tỉ giá ngân hàng:                      | Qui đổi VND: </p>
        <p style="margin: 2px 0 0 0;">Bằng chữ: </p>
      </div>
    </div>





    <!-- Section 5: Recipient Info -->
    <div style="font-size: 15px; margin-bottom: 24px;">
      <p style="font-weight: 700; margin: 0 0 6px 0;">5. Thông tin đơn vị/cá nhân được thanh toán:</p>
      
      <div style="display: flex; flex-direction: column; gap: 6px; margin-left: 16px;">
        <!-- Option A: Single Beneficiary -->
        <div>
          <div style="display: flex; align-items: baseline;">
            <span style="font-family: monospace; font-size: 16px; margin-right: 8px;">
              {{ paymentData?.RQType.includes('08')  ? '☐' : '☑' }}
            </span>
            <span>Thanh toán cho 01 đơn vị/cá nhân</span>
          </div>
          <div v-if="!paymentData?.RQType.includes('08')" style="margin-left: 24px; margin-top: 4px; font-size: 14px;">
            <p style="margin: 2px 0;">Tên đơn vị/cá nhân: {{ paymentData?.NCC || 'N/A' }}</p>
            <p style="margin: 2px 0;">Số tài khoản: {{ paymentData?.AcctNo || 'N/A' }} — Ngân hàng: {{ paymentData?.Bank || 'N/A' }}</p>
            <p style="margin: 2px 0;">FOP: {{ paymentData?.FOP || 'Chuyển khoản' }}</p>
          </div>
        </div>

        <!-- Option B: Multiple Beneficiaries -->
        <div style="display: flex; align-items: baseline;">
          <span style="font-family: monospace; font-size: 16px; margin-right: 8px;">
            {{ paymentData?.RQType.includes('08')  ? '☑' : '☐' }}
          </span>
          <span>Thanh toán cho nhiều cá nhân (chỉ áp dụng khi chung mã mục chi): đính kèm bảng kê</span>
        </div>
      </div>
    </div>

    <!-- Section 6: Signatures Block -->
    <div style="margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
      <p style="font-weight: 700; font-size: 15px; margin: 0 0 16px 0;">6. Xác nhận và ký duyệt</p>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; text-align: center; font-size: 14px;">
        <!-- Requester -->
        <div>
          <p style="font-weight: 700; margin: 0 0 8px 0;">Người đề nghị</p>
          <div style="min-height: 70px;"></div>
          <p style="font-weight: 700; margin: 0;">{{ paymentData?.NguoiDN }}</p>
        </div>

        <!-- Budget Verifier / Approver -->
        <div>
          <p style="font-weight: 700; margin: 0 0 8px 0;">Người duyệt</p>
          <div v-if="TBP_Ky.length>0"  style="min-height: 40px; font-size: 12px; color: #059669; border: 1px dashed #059669; padding: 6px; margin-bottom: 8px; text-align: left;">
            <div> {{ TBP_Ky[0] }}</div>
            <div> {{ TBP_Ky[1] }}</div>
          </div>
        </div>

        <!-- Final Approver -->
        <div>
          <p style="font-weight: 700; margin: 0 0 8px 0;">Xác nhận trong ngân sách</p>
          <div v-if="KT_XN.length>0"  style="min-height: 40px; font-size: 12px; color: #059669; border: 1px dashed #059669; padding: 6px; margin-bottom: 8px; text-align: left;">
            <div> {{ KT_XN[0] }}</div>
            <div> {{ KT_XN[1] }}</div>
          </div>  
        </div>
      </div>
    </div>

    <!-- Section 7: Over-budget (Optional / Conditional) -->
    <div v-if="paymentData?.OverBudget" style="margin-top: 24px; font-size: 14px;">
      <p style="font-weight: 700; margin: 0 0 4px 0;">7. Trường hợp vượt ngân sách</p>
      <p style="margin: 2px 0;">Số tiền vượt/ngoài dự toán: </p>
      <p style="margin: 2px 0;">Ý kiến của bộ phận đề nghị thanh toán: </p>
      <p style="margin: 2px 0;">Phê duyệt của Ban Lãnh đạo </p>
    </div>

  </div>
</template>

<script>
import { SoRaChu, toCurrency } from '~/utils/SoRaChu'
export default {
  name: 'DeNghiThanhToan',
  props: {
    paymentData: {
      type: Object,
      default: () => ({})
    }
  },
  computed: {
    currentDate() {
      const today = new Date()
      return [
        today.getDate(),
        today.getMonth() + 1,
        today.getFullYear()
      ]
    },
    formattedAmount() {
      if (!this.paymentData?.Amount) return '₫0'
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: this.paymentData.Curr  }).format(this.paymentData.Amount)
    }, 
    tenBP() {
        const arrPRJ = [
            {SBU: "WSU", Name: "Western Sydney Bachelor"},
            {SBU: "MBA", Name: "Western Sydney MBA"},
            {SBU: "MASSEY", Name: "Massey"},
            {SBU: "UQAM", Name: "UQAM"},
            {SBU: "GP", Name: "Global Pathway"},
            {SBU: "OTHER", Name: "Khác"},
            {SBU: "MKTG", Name: "Marketing"},
            {SBU: "SALES", Name: "Tuyển sinh"},
            {SBU: "TruongTN", Name: "VP Trường TN"},
            {SBU: "DUAN_ISI", Name: "Dự án ISI"},
            {SBU: "DUAN_ARDC", Name: "Dự án ARDC"},
            {SBU: "VP_ISB", Name: "Văn phòng ISB"},
            {SBU: "QUY_PL", Name: "Quỹ Phúc lợi"}
        ]
        return arrPRJ.find(f=>f.SBU==this.paymentData.SBU).Name
    }, 
    TBP_Ky() {
        const arrFeedBack = JSON.parse(this.paymentData.Aproval)
        let DuyetBoi = []
        for (let f = 0; f < arrFeedBack.length; f++) {
            let FullName = arrFeedBack[f].FullName
            if (!FullName) FullName = arrFeedBack[f].By.split('@')[0]
            const NgayTxt = arrFeedBack[f].TrxDate.replace('T', ' ').replace('Z', '')
            if (arrFeedBack[f].Stage.substring(0, 3) === 'TBP') {
                DuyetBoi.push(`Duyệt bởi: ${FullName}`) 
                DuyetBoi.push(`Ngày: ${NgayTxt}`) 

            }
        }
        return DuyetBoi
    }, 
    KT_XN() {
        const arrFeedBack = JSON.parse(this.paymentData.Aproval)
        let XNBoi = []
        for (let f = 0; f < arrFeedBack.length; f++) {
            let FullName = arrFeedBack[f].FullName
            if (!FullName) FullName = arrFeedBack[f].By.split('@')[0]
            const NgayTxt = arrFeedBack[f].TrxDate.replace('T', ' ').replace('Z', '')
            if (arrFeedBack[f].Stage.substring(0, 2) === 'YC') {
                XNBoi.push(`XN bởi: ${FullName}`) 
                XNBoi.push(`Ngày: ${NgayTxt}`) 
            }
        }
        return XNBoi
    }, 

},
  methods: {
    isRecipientType(type) {
      return this.paymentData?.recipientType === type
    }
  }
}
</script>
