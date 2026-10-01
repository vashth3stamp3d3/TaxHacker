/**
 * Claimable 2025 print-shop charges on Neo Financial Mastercard •••• 6233
 * (Jerrold Jacobe, personal card). Each line is a shareholder-loan expense
 * unless it is capital equipment.
 *
 * Canadian GST-registered merchants are split 5/105. Foreign charges have
 * no GST on the statement.
 *
 * Not claimed here (personal or already on the books): restaurants, Allstate,
 * Fido/Rogers, Shaw home internet, Shell/Super Save gas, Costco/Walmart/grocery,
 * extra Amazon.ca, Shopify Inc Ottawa platform fees, Best Buy, IKEA, StovePay,
 * Twenty20, Temu, Disneyland, Alibaba Klarna instalments (FP-0037–FP-0046),
 * ENMAX (already on 2300), and the PayPal TradingView card charge (booked from
 * invoice FP-0055).
 */

export const NEO_2025_SOURCE = "neo-2025-card"
export const NEO_CARD_LAST4 = "6233"

export const NEO_GST_INCLUSIVE_KINDS = [
  "blanks",
  "uline",
  "homedepot",
  "ctire",
  "rona",
  "memex",
  "msft",
  "ups",
  "purolator",
  "chitchats",
  "trexity",
  "metal",
] as const

export const NEO_ACCOUNT_NAMES: Record<string, string> = {
  "1600": "Equipment",
  "5000": "Paper Cost",
  "5040": "Shipping Cost",
  "5100": "Supplies Expense",
  "6020": "Software",
  "6050": "Marketing",
}

export type NeoClaimKind =
  | "blanks" | "bambu" | "uline" | "homedepot" | "ctire" | "rona" | "memex" | "adobe" | "msft"
  | "cursor" | "openai" | "eleven" | "xai" | "blackmagic" | "blackforest" | "meta" | "ups"
  | "purolator" | "chitchats" | "trexity" | "nucleo" | "metal"

export type NeoClaim = {
  postedOn: string
  kind: NeoClaimKind
  accountCode: string
  label: string
  description: string
  totalCents: number
  netCents: number
  gstCents: number
  ccaClass?: "class8" | "class50"
}

export const NEO_2025_CLAIMS: NeoClaim[] = [
  { postedOn: "2025-01-03", kind: "ctire", accountCode: "5100", label: "Canadian Tire shop supplies", description: "CANADIAN TIRE #419 CALGARY CAN", totalCents: 5457, netCents: 5197, gstCents: 260 },
  { postedOn: "2025-01-08", kind: "nucleo", accountCode: "6050", label: "Nucleo Analytics marketing", description: "PAYPAL *NUCLEO 4029357733 CAN", totalCents: 46937, netCents: 46937, gstCents: 0 },
  { postedOn: "2025-01-11", kind: "msft", accountCode: "6020", label: "Microsoft 365", description: "Microsoft-G072375146 msbill.info CAN", totalCents: 1921, netCents: 1830, gstCents: 91 },
  { postedOn: "2025-01-16", kind: "ctire", accountCode: "5100", label: "Canadian Tire shop supplies", description: "CANADIAN TIRE #419 CALGARY CAN", totalCents: 6298, netCents: 5998, gstCents: 300 },
  { postedOn: "2025-01-18", kind: "bambu", accountCode: "1600", label: "Bambu Lab 3D printer", description: "PPP*store bambulab com HongKong HKG", totalCents: 65514, netCents: 65514, gstCents: 0, ccaClass: "class8" },
  { postedOn: "2025-01-22", kind: "homedepot", accountCode: "5100", label: "Home Depot shop supplies", description: "THE HOME DEPOT #7111 CALGARY CAN", totalCents: 3507, netCents: 3340, gstCents: 167 },
  { postedOn: "2025-01-23", kind: "homedepot", accountCode: "5100", label: "Home Depot shop supplies", description: "THE HOME DEPOT #7111 CALGARY CAN", totalCents: 4110, netCents: 3914, gstCents: 196 },
  { postedOn: "2025-01-24", kind: "homedepot", accountCode: "5100", label: "Home Depot shop supplies", description: "THE HOME DEPOT #7111 CALGARY CAN", totalCents: 3968, netCents: 3779, gstCents: 189 },
  { postedOn: "2025-01-26", kind: "adobe", accountCode: "6020", label: "Adobe Creative Cloud", description: "ADOBE *ADOBE SAN JOSE USA", totalCents: 1364, netCents: 1364, gstCents: 0 },
  { postedOn: "2025-02-05", kind: "openai", accountCode: "6020", label: "OpenAI", description: "OPENAI +14158799686 USA (USD -21.63)", totalCents: 3104, netCents: 3104, gstCents: 0 },
  { postedOn: "2025-02-11", kind: "msft", accountCode: "6020", label: "Microsoft 365", description: "Microsoft-G076718437 msbill.info CAN", totalCents: 1921, netCents: 1830, gstCents: 91 },
  { postedOn: "2025-02-13", kind: "nucleo", accountCode: "6050", label: "Nucleo Analytics marketing", description: "PAYPAL *NUCLEOANALY 4029357733 SGP", totalCents: 1235, netCents: 1235, gstCents: 0 },
  { postedOn: "2025-02-21", kind: "homedepot", accountCode: "5100", label: "Home Depot shop supplies", description: "PAYPAL *HOMEDEPOTCA 4029357733 CAN", totalCents: 31628, netCents: 30122, gstCents: 1506 },
  { postedOn: "2025-02-21", kind: "homedepot", accountCode: "5100", label: "Home Depot shop supplies", description: "THE HOME DEPOT #7037 CALGARY CAN", totalCents: 501, netCents: 477, gstCents: 24 },
  { postedOn: "2025-02-21", kind: "homedepot", accountCode: "5100", label: "Home Depot shop supplies", description: "THE HOME DEPOT #7037 CALGARY CAN", totalCents: 9010, netCents: 8581, gstCents: 429 },
  { postedOn: "2025-02-22", kind: "rona", accountCode: "5100", label: "Rona shop supplies", description: "RONA CALGARY 62860 CALGARY CAN", totalCents: 5996, netCents: 5710, gstCents: 286 },
  { postedOn: "2025-02-24", kind: "rona", accountCode: "5100", label: "Rona shop supplies", description: "RONA CALGARY 62860 CALGARY CAN", totalCents: 9900, netCents: 9429, gstCents: 471 },
  { postedOn: "2025-02-25", kind: "blanks", accountCode: "5000", label: "S&S Activewear blanks", description: "S&S ACTIVEWEAR CANADA MONTREAL CAN", totalCents: 6688, netCents: 6370, gstCents: 318 },
  { postedOn: "2025-02-25", kind: "homedepot", accountCode: "5100", label: "Home Depot shop supplies", description: "THE HOME DEPOT #7111 CALGARY CAN", totalCents: 16710, netCents: 15914, gstCents: 796 },
  { postedOn: "2025-02-26", kind: "adobe", accountCode: "6020", label: "Adobe Creative Cloud", description: "Adobe San Jose USA", totalCents: 1364, netCents: 1364, gstCents: 0 },
  { postedOn: "2025-02-26", kind: "ctire", accountCode: "5100", label: "Canadian Tire shop supplies", description: "CANADIAN TIRE #419 CALGARY CAN", totalCents: 1049, netCents: 999, gstCents: 50 },
  { postedOn: "2025-02-27", kind: "homedepot", accountCode: "5100", label: "Home Depot shop supplies", description: "THE HOME DEPOT #7111 CALGARY CAN", totalCents: 1496, netCents: 1425, gstCents: 71 },
  { postedOn: "2025-03-03", kind: "blanks", accountCode: "5000", label: "S&S Activewear blanks", description: "S&S ACTIVEWEAR CANADA MONTREAL CAN", totalCents: 5981, netCents: 5696, gstCents: 285 },
  { postedOn: "2025-03-05", kind: "blanks", accountCode: "5000", label: "S&S Activewear blanks", description: "S&S ACTIVEWEAR CANADA MONTREAL CAN", totalCents: 2814, netCents: 2680, gstCents: 134 },
  { postedOn: "2025-03-06", kind: "blanks", accountCode: "5000", label: "S&S Activewear blanks", description: "S&S ACTIVEWEAR CANADA MONTREAL CAN", totalCents: 92647, netCents: 88235, gstCents: 4412 },
  { postedOn: "2025-03-08", kind: "blanks", accountCode: "5000", label: "S&S Activewear blanks", description: "S&S ACTIVEWEAR CANADA MONTREAL CAN", totalCents: 1828, netCents: 1741, gstCents: 87 },
  { postedOn: "2025-03-08", kind: "homedepot", accountCode: "5100", label: "Home Depot shop supplies", description: "THE HOME DEPOT #7111 CALGARY CAN", totalCents: 1625, netCents: 1548, gstCents: 77 },
  { postedOn: "2025-03-09", kind: "nucleo", accountCode: "6050", label: "Nucleo Analytics marketing", description: "PAYPAL *NUCLEOANALY 09592097054 SGP", totalCents: 34310, netCents: 34310, gstCents: 0 },
  { postedOn: "2025-03-10", kind: "blanks", accountCode: "5000", label: "S&S Activewear blanks", description: "S&S ACTIVEWEAR CANADA MONTREAL CAN", totalCents: 2373, netCents: 2260, gstCents: 113 },
  { postedOn: "2025-03-10", kind: "msft", accountCode: "6020", label: "Microsoft 365", description: "MICROSOFT#G080692196 MISSISSAUGA CAN", totalCents: 1921, netCents: 1830, gstCents: 91 },
  { postedOn: "2025-03-13", kind: "blanks", accountCode: "5000", label: "S&S Activewear blanks", description: "S&S ACTIVEWEAR CANADA MONTREAL CAN", totalCents: 4617, netCents: 4397, gstCents: 220 },
  { postedOn: "2025-03-14", kind: "blanks", accountCode: "5000", label: "S&S Activewear blanks", description: "S&S ACTIVEWEAR CANADA MONTREAL CAN", totalCents: 1294, netCents: 1232, gstCents: 62 },
  { postedOn: "2025-03-18", kind: "blanks", accountCode: "5000", label: "S&S Activewear blanks", description: "S&S ACTIVEWEAR CANADA MONTREAL CAN", totalCents: 6862, netCents: 6535, gstCents: 327 },
  { postedOn: "2025-03-21", kind: "blanks", accountCode: "5000", label: "S&S Activewear blanks", description: "S&S ACTIVEWEAR CANADA MONTREAL CAN", totalCents: 12723, netCents: 12117, gstCents: 606 },
  { postedOn: "2025-03-21", kind: "xai", accountCode: "6020", label: "xAI", description: "XAI LLC +18002698161 USA (USD -30.90)", totalCents: 4442, netCents: 4442, gstCents: 0 },
  { postedOn: "2025-03-26", kind: "adobe", accountCode: "6020", label: "Adobe Creative Cloud", description: "Adobe San Jose USA", totalCents: 1364, netCents: 1364, gstCents: 0 },
  { postedOn: "2025-04-07", kind: "blanks", accountCode: "5000", label: "S&S Activewear blanks", description: "S&S ACTIVEWEAR CANADA MONTREAL CAN", totalCents: 3706, netCents: 3530, gstCents: 176 },
  { postedOn: "2025-04-10", kind: "homedepot", accountCode: "5100", label: "Home Depot shop supplies", description: "THE HOME DEPOT #7111 CALGARY CAN", totalCents: 338, netCents: 322, gstCents: 16 },
  { postedOn: "2025-04-11", kind: "blackmagic", accountCode: "6020", label: "Blackmagic Cloud", description: "BLACKMAGIC CLOUD +14089540500 USA", totalCents: 1103, netCents: 1103, gstCents: 0 },
  { postedOn: "2025-04-11", kind: "homedepot", accountCode: "5100", label: "Home Depot shop supplies", description: "THE HOME DEPOT #7111 CALGARY CAN", totalCents: 2090, netCents: 1990, gstCents: 100 },
  { postedOn: "2025-04-11", kind: "msft", accountCode: "6020", label: "Microsoft 365", description: "MICROSOFT#G085295560 MISSISSAUGA CAN", totalCents: 1921, netCents: 1830, gstCents: 91 },
  { postedOn: "2025-04-14", kind: "nucleo", accountCode: "6050", label: "Nucleo Analytics marketing", description: "PAYPAL *NUCLEOANALY 4029357733 SGP", totalCents: 17928, netCents: 17928, gstCents: 0 },
  { postedOn: "2025-04-16", kind: "eleven", accountCode: "6020", label: "ElevenLabs", description: "ELEVENLABS.IO +19177203691 USA (USD -11.89)", totalCents: 1663, netCents: 1663, gstCents: 0 },
  { postedOn: "2025-04-18", kind: "rona", accountCode: "5100", label: "Rona shop supplies", description: "RONA+ CROSSIRON 88007 ROCKY VIEW CO CAN", totalCents: 14375, netCents: 13690, gstCents: 685 },
  { postedOn: "2025-04-26", kind: "adobe", accountCode: "6020", label: "Adobe Creative Cloud", description: "Adobe Inc San Jose USA", totalCents: 1364, netCents: 1364, gstCents: 0 },
  { postedOn: "2025-05-05", kind: "msft", accountCode: "6020", label: "Microsoft 365", description: "MICROSOFT#G089968986 MISSISSAUGA CAN", totalCents: 1921, netCents: 1830, gstCents: 91 },
  { postedOn: "2025-05-06", kind: "blanks", accountCode: "5000", label: "S&S Activewear blanks", description: "S&S ACTIVEWEAR CANADA MONTREAL CAN", totalCents: 4282, netCents: 4078, gstCents: 204 },
  { postedOn: "2025-05-11", kind: "blackmagic", accountCode: "6020", label: "Blackmagic Cloud", description: "BLACKMAGIC CLOUD +14089540500 USA", totalCents: 1103, netCents: 1103, gstCents: 0 },
  { postedOn: "2025-05-16", kind: "eleven", accountCode: "6020", label: "ElevenLabs", description: "ELEVENLABS.IO +19177203691 USA (USD -23.79)", totalCents: 3333, netCents: 3333, gstCents: 0 },
  { postedOn: "2025-05-22", kind: "blanks", accountCode: "5000", label: "S&S Activewear blanks", description: "S&S ACTIVEWEAR CANADA MONTREAL CAN", totalCents: 3227, netCents: 3073, gstCents: 154 },
  { postedOn: "2025-05-24", kind: "trexity", accountCode: "5040", label: "Trexity freight", description: "TREXITY +13433125644 CAN", totalCents: 1260, netCents: 1200, gstCents: 60 },
  { postedOn: "2025-05-26", kind: "adobe", accountCode: "6020", label: "Adobe Creative Cloud", description: "Adobe San Jose USA", totalCents: 1364, netCents: 1364, gstCents: 0 },
  { postedOn: "2025-05-27", kind: "blanks", accountCode: "5000", label: "S&S Activewear blanks", description: "S&S ACTIVEWEAR CANADA MONTREAL CAN", totalCents: 4146, netCents: 3949, gstCents: 197 },
  { postedOn: "2025-05-27", kind: "ctire", accountCode: "5100", label: "Canadian Tire shop supplies", description: "CANADIAN TIRE #419 CALGARY CAN", totalCents: 4199, netCents: 3999, gstCents: 200 },
  { postedOn: "2025-05-31", kind: "blackforest", accountCode: "6020", label: "Black Forest Labs", description: "BLACK FOREST LABS +16502838796 USA", totalCents: 1426, netCents: 1426, gstCents: 0 },
  { postedOn: "2025-06-04", kind: "msft", accountCode: "6020", label: "Microsoft 365", description: "Microsoft-G094127283 msbill.info CAN", totalCents: 2017, netCents: 1921, gstCents: 96 },
  { postedOn: "2025-06-06", kind: "meta", accountCode: "6050", label: "Meta ads", description: "PP*METAPLATFOR 4029357733 USA", totalCents: 10500, netCents: 10500, gstCents: 0 },
  { postedOn: "2025-06-08", kind: "meta", accountCode: "6050", label: "Meta ads", description: "PP*METAPLATFOR 4029357733 USA", totalCents: 10500, netCents: 10500, gstCents: 0 },
  { postedOn: "2025-06-09", kind: "blanks", accountCode: "5000", label: "S&S Activewear blanks", description: "S&S ACTIVEWEAR CANADA MONTREAL CAN", totalCents: 8998, netCents: 8570, gstCents: 428 },
  { postedOn: "2025-06-11", kind: "blackmagic", accountCode: "6020", label: "Blackmagic Cloud", description: "BLACKMAGIC CLOUD +14089540500 USA", totalCents: 1103, netCents: 1103, gstCents: 0 },
  { postedOn: "2025-06-11", kind: "blanks", accountCode: "5000", label: "S&S Activewear blanks", description: "S&S ACTIVEWEAR CANADA MONTREAL CAN", totalCents: 14580, netCents: 13886, gstCents: 694 },
  { postedOn: "2025-06-16", kind: "eleven", accountCode: "6020", label: "ElevenLabs", description: "ELEVENLABS.IO +19177203691 USA (USD -23.79)", totalCents: 3238, netCents: 3238, gstCents: 0 },
  { postedOn: "2025-06-18", kind: "ups", accountCode: "5040", label: "UPS freight", description: "UPS CALGARY SOUTH 7436 CALGARY CAN", totalCents: 3813, netCents: 3631, gstCents: 182 },
  { postedOn: "2025-06-19", kind: "blanks", accountCode: "5000", label: "S&S Activewear blanks", description: "S&S ACTIVEWEAR CANADA MONTREAL CAN", totalCents: 7704, netCents: 7337, gstCents: 367 },
  { postedOn: "2025-06-25", kind: "nucleo", accountCode: "6050", label: "Nucleo Analytics marketing", description: "PAYPAL *NUCLEOANALY 09592097054 SGP", totalCents: 21091, netCents: 21091, gstCents: 0 },
  { postedOn: "2025-06-26", kind: "adobe", accountCode: "6020", label: "Adobe Creative Cloud", description: "Adobe San Jose USA", totalCents: 1364, netCents: 1364, gstCents: 0 },
  { postedOn: "2025-06-29", kind: "meta", accountCode: "6050", label: "Meta ads", description: "PP*METAPLATFOR 4029357733 USA", totalCents: 11550, netCents: 11550, gstCents: 0 },
  { postedOn: "2025-07-02", kind: "blanks", accountCode: "5000", label: "S&S Activewear blanks", description: "S&S ACTIVEWEAR CANADA MONTREAL CAN", totalCents: 35262, netCents: 33583, gstCents: 1679 },
  { postedOn: "2025-07-03", kind: "msft", accountCode: "6020", label: "Microsoft 365", description: "MICROSOFT#G099157933 MISSISSAUGA CAN", totalCents: 2017, netCents: 1921, gstCents: 96 },
  { postedOn: "2025-07-03", kind: "nucleo", accountCode: "6050", label: "Nucleo Analytics marketing", description: "PAYPAL *NUCLEOANALY 09592097054 SGP", totalCents: 49667, netCents: 49667, gstCents: 0 },
  { postedOn: "2025-07-07", kind: "blanks", accountCode: "5000", label: "S&S Activewear blanks", description: "S&S ACTIVEWEAR CANADA MONTREAL CAN", totalCents: 7130, netCents: 6790, gstCents: 340 },
  { postedOn: "2025-07-07", kind: "homedepot", accountCode: "5100", label: "Home Depot shop supplies", description: "PAYPAL *HOMEDEPOTCA 4029357733 CAN", totalCents: 16590, netCents: 15800, gstCents: 790 },
  { postedOn: "2025-07-10", kind: "ups", accountCode: "5040", label: "UPS freight", description: "UPS CALGARY SOUTH 7436 CALGARY CAN", totalCents: 4653, netCents: 4431, gstCents: 222 },
  { postedOn: "2025-07-11", kind: "blackmagic", accountCode: "6020", label: "Blackmagic Cloud", description: "BLACKMAGIC CLOUD FREMONT USA", totalCents: 1103, netCents: 1103, gstCents: 0 },
  { postedOn: "2025-07-14", kind: "chitchats", accountCode: "5040", label: "Chit Chats freight", description: "CHIT CHATS VANCOUVER CAN", totalCents: 2600, netCents: 2476, gstCents: 124 },
  { postedOn: "2025-07-16", kind: "eleven", accountCode: "6020", label: "ElevenLabs", description: "ELEVENLABS.IO NEW YORK USA (USD -23.79)", totalCents: 3273, netCents: 3273, gstCents: 0 },
  { postedOn: "2025-07-22", kind: "cursor", accountCode: "6020", label: "Cursor IDE", description: "CURSOR, AI POWERED IDE NEW YORK USA (USD", totalCents: 2822, netCents: 2822, gstCents: 0 },
  { postedOn: "2025-07-23", kind: "blanks", accountCode: "5000", label: "S&S Activewear blanks", description: "S&S ACTIVEWEAR CANADA MONTREAL CAN", totalCents: 9456, netCents: 9006, gstCents: 450 },
  { postedOn: "2025-07-23", kind: "ctire", accountCode: "5100", label: "Canadian Tire shop supplies", description: "CANADIAN TIRE #419 CALGARY CAN", totalCents: 2204, netCents: 2099, gstCents: 105 },
  { postedOn: "2025-07-24", kind: "cursor", accountCode: "6020", label: "Cursor IDE", description: "CURSOR USAGE MID JUL NEW YORK USA (USD", totalCents: 2811, netCents: 2811, gstCents: 0 },
  { postedOn: "2025-07-25", kind: "cursor", accountCode: "6020", label: "Cursor IDE", description: "CURSOR USAGE MID JUL NEW YORK USA (USD", totalCents: 5652, netCents: 5652, gstCents: 0 },
  { postedOn: "2025-07-26", kind: "adobe", accountCode: "6020", label: "Adobe Creative Cloud", description: "Adobe San Jose USA", totalCents: 1364, netCents: 1364, gstCents: 0 },
  { postedOn: "2025-07-26", kind: "rona", accountCode: "5100", label: "Rona shop supplies", description: "RONA CALGARY 62860 CALGARY CAN", totalCents: 4983, netCents: 4746, gstCents: 237 },
  { postedOn: "2025-07-29", kind: "cursor", accountCode: "6020", label: "Cursor IDE", description: "CURSOR USAGE MID JUL NEW YORK USA (USD", totalCents: 8509, netCents: 8509, gstCents: 0 },
  { postedOn: "2025-07-31", kind: "purolator", accountCode: "5040", label: "Purolator freight", description: "PUROLATOR #60715 CALGARY CAN", totalCents: 1922, netCents: 1830, gstCents: 92 },
  { postedOn: "2025-08-01", kind: "nucleo", accountCode: "6050", label: "Nucleo Analytics marketing", description: "PAYPAL *NUCLEOANALY 09592097054 SGP", totalCents: 10299, netCents: 10299, gstCents: 0 },
  { postedOn: "2025-08-03", kind: "msft", accountCode: "6020", label: "Microsoft 365", description: "Microsoft-G104260525 msbill.info CAN", totalCents: 2017, netCents: 1921, gstCents: 96 },
  { postedOn: "2025-08-05", kind: "cursor", accountCode: "6020", label: "Cursor IDE", description: "CURSOR USAGE JUL NEW YORK USA (USD -10.20)", totalCents: 1408, netCents: 1408, gstCents: 0 },
  { postedOn: "2025-08-06", kind: "blanks", accountCode: "5000", label: "S&S Activewear blanks", description: "S&S ACTIVEWEAR CANADA MONTREAL CAN", totalCents: 3115, netCents: 2967, gstCents: 148 },
  { postedOn: "2025-08-07", kind: "chitchats", accountCode: "5040", label: "Chit Chats freight", description: "CHIT CHATS VANCOUVER CAN", totalCents: 3000, netCents: 2857, gstCents: 143 },
  { postedOn: "2025-08-11", kind: "blackmagic", accountCode: "6020", label: "Blackmagic Cloud", description: "BLACKMAGIC CLOUD FREMONT USA", totalCents: 1103, netCents: 1103, gstCents: 0 },
  { postedOn: "2025-08-16", kind: "eleven", accountCode: "6020", label: "ElevenLabs", description: "ELEVENLABS.IO NEW YORK USA (USD -23.79)", totalCents: 3289, netCents: 3289, gstCents: 0 },
  { postedOn: "2025-08-22", kind: "cursor", accountCode: "6020", label: "Cursor IDE", description: "CURSOR, AI POWERED IDE NEW YORK USA (USD", totalCents: 2870, netCents: 2870, gstCents: 0 },
  { postedOn: "2025-08-23", kind: "metal", accountCode: "5100", label: "Calgary Metal Market", description: "CALGARY METAL MARKET CALGARY CAN", totalCents: 2625, netCents: 2500, gstCents: 125 },
  { postedOn: "2025-08-25", kind: "uline", accountCode: "5100", label: "Uline packing supplies", description: "ULINE 800-295-5510 CAN", totalCents: 37080, netCents: 35314, gstCents: 1766 },
  { postedOn: "2025-08-26", kind: "adobe", accountCode: "6020", label: "Adobe Creative Cloud", description: "Adobe San Jose USA", totalCents: 1364, netCents: 1364, gstCents: 0 },
  { postedOn: "2025-09-02", kind: "ups", accountCode: "5040", label: "UPS freight", description: "UPS CALGARY SOUTH 7436 CALGARY CAN", totalCents: 3100, netCents: 2952, gstCents: 148 },
  { postedOn: "2025-09-03", kind: "nucleo", accountCode: "6050", label: "Nucleo Analytics marketing", description: "PAYPAL *NUCLEOANALY 09592097054 SGP", totalCents: 32300, netCents: 32300, gstCents: 0 },
  { postedOn: "2025-09-04", kind: "msft", accountCode: "6020", label: "Microsoft 365", description: "Microsoft-G109835334 msbill.info CAN", totalCents: 2017, netCents: 1921, gstCents: 96 },
  { postedOn: "2025-09-04", kind: "rona", accountCode: "5100", label: "Rona shop supplies", description: "RONA CALGARY 62860 CALGARY CAN", totalCents: 3777, netCents: 3597, gstCents: 180 },
  { postedOn: "2025-09-06", kind: "cursor", accountCode: "6020", label: "Cursor IDE", description: "CURSOR USAGE AUG NEW YORK USA (USD -13.64)", totalCents: 1888, netCents: 1888, gstCents: 0 },
  { postedOn: "2025-09-11", kind: "blackmagic", accountCode: "6020", label: "Blackmagic Cloud", description: "BLACKMAGIC CLOUD FREMONT USA", totalCents: 1103, netCents: 1103, gstCents: 0 },
  { postedOn: "2025-09-22", kind: "cursor", accountCode: "6020", label: "Cursor IDE", description: "CURSOR, AI POWERED IDE NEW YORK USA (USD", totalCents: 2847, netCents: 2847, gstCents: 0 },
  { postedOn: "2025-09-26", kind: "adobe", accountCode: "6020", label: "Adobe Creative Cloud", description: "Adobe San Jose USA", totalCents: 1364, netCents: 1364, gstCents: 0 },
  { postedOn: "2025-10-06", kind: "ctire", accountCode: "5100", label: "Canadian Tire shop supplies", description: "CANADIAN TIRE #419 CALGARY CAN", totalCents: 3148, netCents: 2998, gstCents: 150 },
  { postedOn: "2025-10-09", kind: "msft", accountCode: "6020", label: "Microsoft 365", description: "MICROSOFT#G115731110 MISSISSAUGA CAN", totalCents: 2017, netCents: 1921, gstCents: 96 },
  { postedOn: "2025-10-12", kind: "memex", accountCode: "1600", label: "Memory Express computer parts", description: "MemoryExpress CAL NE Calgary CAN", totalCents: 31635, netCents: 30129, gstCents: 1506, ccaClass: "class50" },
  { postedOn: "2025-10-15", kind: "rona", accountCode: "5100", label: "Rona shop supplies", description: "RONA CALGARY 62860 CALGARY CAN", totalCents: 942, netCents: 897, gstCents: 45 },
  { postedOn: "2025-10-23", kind: "meta", accountCode: "6050", label: "Meta ads", description: "PP*METAPLATFOR 4029357733 USA", totalCents: 1223, netCents: 1223, gstCents: 0 },
  { postedOn: "2025-10-25", kind: "meta", accountCode: "6050", label: "Meta ads", description: "PP*METAPLATFOR 4029357733 USA", totalCents: 908, netCents: 908, gstCents: 0 },
  { postedOn: "2025-10-26", kind: "adobe", accountCode: "6020", label: "Adobe Creative Cloud", description: "Adobe San Jose USA", totalCents: 2099, netCents: 2099, gstCents: 0 },
  { postedOn: "2025-11-05", kind: "msft", accountCode: "6020", label: "Microsoft 365", description: "Microsoft-G121096739 msbill.info CAN", totalCents: 2017, netCents: 1921, gstCents: 96 },
  { postedOn: "2025-11-16", kind: "rona", accountCode: "5100", label: "Rona shop supplies", description: "RONA CALGARY 62860 CALGARY CAN", totalCents: 702, netCents: 669, gstCents: 33 },
  { postedOn: "2025-11-16", kind: "rona", accountCode: "5100", label: "Rona shop supplies", description: "RONA+ CALGARY SUNRIDGE CALGARY CAN", totalCents: 4095, netCents: 3900, gstCents: 195 },
  { postedOn: "2025-11-26", kind: "adobe", accountCode: "6020", label: "Adobe Creative Cloud", description: "Adobe San Jose USA", totalCents: 2099, netCents: 2099, gstCents: 0 },
  { postedOn: "2025-12-04", kind: "msft", accountCode: "6020", label: "Microsoft 365", description: "MICROSOFT#G126512812 HALIFAX CAN", totalCents: 2017, netCents: 1921, gstCents: 96 },
  { postedOn: "2025-12-17", kind: "ctire", accountCode: "5100", label: "Canadian Tire shop supplies", description: "CANADIAN TIRE #496 CALGARY CAN", totalCents: 3985, netCents: 3795, gstCents: 190 },
  { postedOn: "2025-12-18", kind: "ctire", accountCode: "5100", label: "Canadian Tire shop supplies", description: "CANADIAN TIRE #496 CALGARY CAN", totalCents: 6298, netCents: 5998, gstCents: 300 },
  { postedOn: "2025-12-19", kind: "ctire", accountCode: "5100", label: "Canadian Tire shop supplies", description: "CANADIAN TIRE #419 CALGARY CAN", totalCents: 3149, netCents: 2999, gstCents: 150 },
  { postedOn: "2025-12-20", kind: "ctire", accountCode: "5100", label: "Canadian Tire shop supplies", description: "CANADIAN TIRE #419 CALGARY CAN", totalCents: 576, netCents: 549, gstCents: 27 },
  { postedOn: "2025-12-20", kind: "homedepot", accountCode: "5100", label: "Home Depot shop supplies", description: "THE HOME DEPOT #7111 CALGARY CAN", totalCents: 1258, netCents: 1198, gstCents: 60 },
  { postedOn: "2025-12-24", kind: "ctire", accountCode: "5100", label: "Canadian Tire shop supplies", description: "CANADIAN TIRE #419 CALGARY CAN", totalCents: 41473, netCents: 39498, gstCents: 1975 },
  { postedOn: "2025-12-24", kind: "ctire", accountCode: "5100", label: "Canadian Tire shop supplies", description: "CANADIAN TIRE #496 CALGARY CAN", totalCents: 1574, netCents: 1499, gstCents: 75 },
  { postedOn: "2025-12-27", kind: "adobe", accountCode: "6020", label: "Adobe Creative Cloud", description: "Adobe San Jose USA", totalCents: 1364, netCents: 1364, gstCents: 0 },
  { postedOn: "2025-12-27", kind: "ups", accountCode: "5040", label: "UPS freight", description: "UPS*WEB COD 888-520-9090 CAN", totalCents: 7948, netCents: 7570, gstCents: 378 },
]

export type NeoJournalLine = {
  accountCode: string
  accountName: string
  debitCents: number
  creditCents: number
  memo: string
  taxCode?: string
}

export type NeoMonthJournal = {
  entryNumber: string
  month: string
  postedOn: string
  claims: NeoClaim[]
}

export function splitGstInclusiveCents(totalCents: number) {
  const gstCents = Math.round((totalCents * 5) / 105)
  return { gstCents, netCents: totalCents - gstCents }
}

export function neoCcaItems(ccaClass: "class8" | "class50") {
  return NEO_2025_CLAIMS.filter((claim) => claim.ccaClass === ccaClass).map((claim) => ({
    invoiceNumber: `NEO-2025-${claim.postedOn.slice(5, 7)}`,
    description: claim.label,
    costCents: claim.netCents,
  }))
}

export function neoClaimTotals(claims: readonly NeoClaim[] = NEO_2025_CLAIMS) {
  return claims.reduce(
    (sum, claim) => ({
      count: sum.count + 1,
      totalCents: sum.totalCents + claim.totalCents,
      netCents: sum.netCents + claim.netCents,
      gstCents: sum.gstCents + claim.gstCents,
    }),
    { count: 0, totalCents: 0, netCents: 0, gstCents: 0 }
  )
}

export function neoMonthlyJournals(): NeoMonthJournal[] {
  const byMonth = new Map<string, NeoClaim[]>()
  for (const claim of NEO_2025_CLAIMS) {
    const month = claim.postedOn.slice(0, 7)
    const list = byMonth.get(month) ?? []
    list.push(claim)
    byMonth.set(month, list)
  }
  return [...byMonth.entries()].map(([month, claims]) => ({
    entryNumber: `NEO-2025-${month.slice(5)}`,
    month,
    postedOn: claims[claims.length - 1].postedOn,
    claims,
  }))
}

export function neoMonthJournalLines(month: NeoMonthJournal): NeoJournalLine[] {
  const lines: NeoJournalLine[] = month.claims.map((claim) => ({
    accountCode: claim.accountCode,
    accountName: NEO_ACCOUNT_NAMES[claim.accountCode] ?? claim.accountCode,
    debitCents: claim.netCents,
    creditCents: 0,
    memo: `${claim.label} · ${claim.description}`,
  }))
  const gstCents = month.claims.reduce((sum, claim) => sum + claim.gstCents, 0)
  if (gstCents > 0) {
    lines.push({
      accountCode: "1160",
      accountName: "GST Input Tax Credits Receivable",
      debitCents: gstCents,
      creditCents: 0,
      memo: `GST ITC ${month.entryNumber}`,
      taxCode: "GST_5_ITC",
    })
  }
  const totalCents = month.claims.reduce((sum, claim) => sum + claim.totalCents, 0)
  lines.push({
    accountCode: "2310",
    accountName: "Shareholder Loan - Jerrold",
    debitCents: 0,
    creditCents: totalCents,
    memo: `Neo •••• ${NEO_CARD_LAST4} print-shop charges ${month.entryNumber}`,
  })
  return lines
}

export function neoMonthBalances(month: NeoMonthJournal) {
  const lines = neoMonthJournalLines(month)
  const debit = lines.reduce((sum, line) => sum + line.debitCents, 0)
  const credit = lines.reduce((sum, line) => sum + line.creditCents, 0)
  const totals = neoClaimTotals(month.claims)
  return debit === credit && credit === totals.totalCents && totals.netCents + totals.gstCents === totals.totalCents
}

