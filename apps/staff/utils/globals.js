import { domainFolders } from '#core/config/domains.js'

export const SQLAPI = "https://mywsu.vn:2096/API/"
export const AI_ENGINE ='vertex'

export const arrAllMajor =  [
  {PRG: "BBUS", Major: ['AF','IB','MK','T042','T165','T166','']},
  {PRG: "BCOMM", Major: ['AD','0159','']},
  {PRG: "BDATA", Major: ['']},
]

export const arrMaCCCD_theoTinh = [
  "001", "002", "004", "006", "008", "010", "011", "012", "014", "015", 
  "017", "019", "020", "022", "024", "025", "026", "027", "030", "031", 
  "033", "034", "035", "036", "037", "038", "040", "042", "044", "045", 
  "046", "048", "049", "051", "052", "054", "056", "058", "060", "062", 
  "064", "066", "067", "068", "070", "072", "074", "075", "077", "079", 
  "080", "082", "083", "084", "086", "087", "089", "091", "092", "093", 
  "094", "095", "096"
]

export const arrDomain = [
  {
    domain: "EAP",
    name: "English For Academic Purposes",
    color: "#E53935",
    logo: "LogoISB.png",
    logoBackground: "#ffffff",
    iconColor: "#E53935",
    folderId: domainFolders.EAP,
    term: "T"
  },
  {
    domain: "ISP",
    name: "Interdisciplinary Science Pathways",
    color: "#a10930",
    logo: "LogoISP.png",
    logoBackground: "#ffffff",
    iconColor: "#a10930",
    folderId: domainFolders.ISP,
    term: "T"
  },
  {
    domain: "WSU",
    name: "Western Sydney Vietnam",
    color: "#a10930",
    logo: "LogoWSU.png",
    logoBackground: "#ffffff",
    iconColor: "#a10930",
    folderId: domainFolders.WSU,
    term: "T"
  },
  {
    domain: "MBA",
    name: "Western Sydney MBA",
    color: "#a10930",
    logo: "LogoWSU.png",
    logoBackground: "#ffffff",
    iconColor: "#a10930",
    folderId: domainFolders.MBA,
    term: "Q"
  },

]

