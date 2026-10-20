import * as XLSX from 'xlsx';

export function ExportToXls(arrData, fileName = 'export.xls', arrSheetName = null) {
  const wb = XLSX.utils.book_new();
  for (let s = 0; s < arrData.length; s++) {
    let ws = XLSX.utils.json_to_sheet(arrData[s]);
    let sheetName = (arrSheetName && s < arrSheetName.length) 
      ? arrSheetName[s] 
      : 'Sheet' + s;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }
  XLSX.writeFile(wb, fileName);
}