const mangso = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

export function toCurrency(plainNumber, curr){
    if (!plainNumber) {return ""};
    let rawNumber = plainNumber
    if (typeof plainNumber=="string"){
        rawNumber = plainNumber.replace(/[^0-9]/g, ''); 
    }
    if (curr==null){
      return new Intl.NumberFormat("en-US").format(rawNumber);
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: curr }).format(rawNumber)
}      

export function SoRaChu(so) {
    if (so == 0) return mangso[0];
    let KQ = ""
    if (so>999999999){
      let ty = Math.floor(so / 10**9)
      KQ = DocBockThree_(ty) + " tỷ "
      so = so - ty*10**9
    }
    if (so>999999){
      let trieu = Math.floor(so / 10**6)
      KQ = KQ + DocBockThree_(trieu) + " triệu"
      so = so - trieu*10**6
    }
    if (so>999){
      let ngan = Math.floor(so / 10**3)
      KQ = KQ + DocBockThree_(ngan) + " nghìn"
      so = so - ngan*10**3
    }
    if (so<1000){
      KQ = KQ + DocBockThree_(so) 
    }
    KQ = KQ.trim()
    if (KQ.substring(0,2)=="lẻ"){
      KQ = KQ.substring(3,128)
    }
    return KQ
}

function DocHangChuc_(so ) {
    let chuoi = ""
    let chuc = Math.floor(so / 10)
    let donvi = so % 10
    
    if (chuc > 1) {
        chuoi = " " + mangso[chuc] + " mươi";
        if (donvi == 1) {
            chuoi += " mốt";
        }
    } else if (chuc == 1) {
        chuoi = " mười";
        if (donvi == 1) {
            chuoi += " một";
        }
    } else if (chuc == 0 && donvi > 0) {
        chuoi = " lẻ";
    }
    
    if (donvi == 5 && chuc >= 1) {
        chuoi += " lăm";
    } else if (donvi > 1 || (donvi == 1 && chuc == 0)) {
        chuoi += " " + mangso[donvi];
    }
    return chuoi;
}

function DocBockThree_(so) {
    let chuoi = "";
    let tram = Math.floor(so / 100);
    so = so % 100;
    if (tram > 0) {
        chuoi = " " + mangso[tram] + " trăm"
        chuoi += DocHangChuc_(so, true);
    } else {
        chuoi = DocHangChuc_(so, false);
    }
    return chuoi;
}

