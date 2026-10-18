/**
 * 玩具總動員冒險卡片：所有文字、禮物名稱、對話都在這裡改。
 *
 * - 想換名字：改最上面的 HER / ME。
 * - 字串以「【待填」開頭的地方，畫面上會用醒目的樣式標示，方便檢查還沒填的內容。
 * - 照片：把檔案放進 public/ 資料夾，例如 public/first-meet.jpg，然後填 '/first-meet.jpg'。空字串會顯示預留框。
 */

/** 她（收禮物的閨蜜）的名字 */
const HER = "凱蒂";
/** 你的名字（出現在信的署名） */
const ME = "林總";

/** 對話的說話者：her = 她、james = James、narrator = 旁白、toy = 玩具們 */
export type Speaker = "her" | "james" | "narrator" | "toy";
export interface Line {
  who: Speaker;
  text: string;
}
/** 角色外觀（顏色都可以改）：hair 頭髮、hairRoot 髮根（James 的漸層）、skin 膚色、shirt 上衣、jacket 外套、pants 褲子、hat 牛仔帽 */
export interface ToyLook {
  hair: string;
  hairRoot?: string;
  skin: string;
  shirt: string;
  jacket?: string;
  pants: string;
  hat?: string;
}

export const toy = {
  herName: HER,
  myName: ME,

  /** 開場選擇頁 */
  landing: {
    title: `歡迎來到${HER}的玩具世界！`,
    subtitle: "請選擇你的冒險開場：",
    options: [
      /** 卡片左邊的插圖是 ToyHeroes.vue（太空騎警 + 牛仔） */
      { label: "玩具總動員奇幻冒險", hint: `專屬於${HER}的尋寶之旅` },
    ],
  },

  /** 角色外觀 */
  looks: {
    /** 她：黑色中分長直髮、圓臉笑咪咪，戴著紅色牛仔帽 */
    her: {
      hair: "#1a1412",
      skin: "#f6d6c0",
      shirt: "#7cc6ff",
      pants: "#2f6fdb",
      hat: "#e23b2e",
    } as ToyLook,
    /** James：金棕色凌亂瀏海、深藍鋪棉外套、白色印花 T 恤、淺色破洞寬褲、黑靴 */
    james: {
      hair: "#c9a26a",
      hairRoot: "#7a5a38",
      skin: "#f5dcc8",
      shirt: "#f4f4f2",
      jacket: "#2e3f66",
      pants: "#b4cbe0",
    } as ToyLook,
  },

  /** 進入地圖前的開場白 */
  intro: [
    { who: "narrator", text: "安迪出門了，房間裡的玩具們偷偷動了起來……" },
    {
      who: "toy",
      text: `聽說今天是詹雨璇，壢商李知恩aka龍潭蔡依林的生日，我們幫妳準備了禮物與祝福，快去看看吧!
`,
    },
    {
      who: "narrator",
      text: `玩具們把禮物藏在房間的各個角落。${HER}，沿著地板上的路線出發，把它們一個一個找回來吧！`,
    },
  ] as Line[],

  /** 地圖最上方的標題 */
  mapTitle: `${HER}房間尋寶地圖`,

  /** 地圖起點 */
  start: { place: "凱蒂的玩具箱" },

  /** 第 1～3 站：實體禮物 */
  stations: {
    /** 第 1 站：拆開禮物盒 */
    necklace1: {
      place: "凱蒂的床邊",
      arrive: "床底下好像藏了一個綁著蝴蝶結的禮物盒……",
      gift: "皮繩項鍊",
      /** 禮物長什麼樣子（畫面上的卡通圖就是照這個畫的） */
      desc: "咖啡色麂皮繩、金色滑扣，再掛上一顆像胡迪胸前那樣的警長星星。",
      giftNote: "",
      /** 收到項鍊時給她的祝福 */
      blessingTitle: "禮物的寓意",
      blessing:
        "你看，這條項鍊有胡迪的星星徽章，戴上它!妳就是警長！這條皮繩就像我們緊緊繫在一起的緣分，不管接下來去哪裡冒險，你永遠是我心目中最帥的警長！",
    },
    /** 第 2 站：披薩星球夾娃娃機 */
    necklace2: {
      place: "披薩星球夾娃娃機",
      arrive: "是披薩星球的夾娃娃機！裡面的三眼怪們正在等待「爪子」降臨……",
      alienLine: "被選中了～！爪子是我們的主人～",
      gift: "玩具總動員項鍊",
      desc: "銀色細鍊上掛滿小吊飾：火箭、恐龍、太空人、牛仔、雲朵、愛心和星星。",
      giftNote: " ",
      bondTitle: "禮物的寓意",
      bond: "我們都在慢慢長大，常常要變成別人期待的大人。但我希望你戴著這條項鍊的時候可以短暫的允許自己，此刻不長大也沒關係喔~",
    },
    /** 第 3 站：翻牌配對 */
    clips: {
      place: "玩具箱前的翻牌遊戲",
      arrive: `地上散落著好多張${HER}的照片。把成對的找出來...`,
      /** 翻牌遊戲的照片（每張會出現兩次配成一對）；放在 public/pairs/ 裡，想換照片直接覆蓋或改路徑 */
      pairPhotos: [
        "/pairs/yuxuan-1.jpg",
        "/pairs/yuxuan-2.jpg",
        "/pairs/yuxuan-3.jpg",
        "/pairs/yuxuan-4.jpg",
      ],
      gift: "一對髮夾",
      desc: "兩支銀色髮夾：一支是胡迪和它的警長徽章，一支是粉紅色的翠絲與紅心。",
      giftNote:
        "一個是胡迪，另一個是翠絲跟紅心。希望你不管是化妝、夾瀏海，還是平時出門隨手一夾的時候，讓它幫你把煩惱通通夾掉！",
    },
  },

  /** 特別彩蛋：James 突然出現，一起組隊冒險 */
  james: {
    name: "James",
    tag: "CORTIS 的趙雨凡",
    place: "書架下的神秘人影",
    /** 出現時的對話 */
    appear: [
      { who: "narrator", text: "咦？前面那個人影是……？" },
      { who: "james", text: "嗨！在幹嘛?" },
      { who: "her", text: "（揉眼睛）……James？！真的假的？！" },
      {
        who: "james",
        text: "聽說今天是你生日，妳朋友請我跟你一起找寶藏",
      },
      { who: "narrator", text: "✦ James 加入了隊伍！" },
    ] as Line[],
    /** 一起完成的任務：輪流疊積木 */
    mission: {
      title: "聯合任務：一起把積木疊高！",
      desc: "寶藏地圖卡在書架最上層。輪流放積木，疊到搆得到為止！",
      blocks: 6,
      /** 每疊一塊出現一句（輪流：她、James、她、James…） */
      banter: [
        { who: "her", text: "我先來！" },
        { who: "james", text: "欸妳那塊放歪了，嗚..." },
        { who: "her", text: "(看完趙雨凡放的)...." },
        { who: "james", text: "欸這不簡單!" },
        { who: "her", text: "快到了!快到了!" },
        { who: "james", text: "欸!欸!欸!Nice!" },
      ] as Line[],
    },
    /** 任務完成後 */
    afterMission: [
      {
        who: "james",
        text: "拿到地圖了！上面寫著：終極寶藏，就在凱蒂的特製寶箱裡。",
      },
      { who: "her", text: "那……你會陪我走到最後嗎？" },
      { who: "james", text: "當然！GO!Kitty!" },
    ] as Line[],
    /** 抵達寶箱前的道別 */
    farewell: [
      {
        who: "james",
        text: "寶箱就在前面了。接下來的驚喜，要由準備這一切的人親手交給妳。",
      },
      { who: "her", text: "你要走了嗎……？" },
      {
        who: "james",
        text: "今天能跟妳一起冒險，我也很開心！要一直這麼可愛喔，祝妳生日快樂，Bye-bye～",
      },
      { who: "narrator", text: "James 揮揮手，消失在一片星星的光芒裡。" },
    ] as Line[],
  },

  /** 第 4 站：終極寶藏 */
  treasure: {
    place: "凱蒂的特製寶箱",
    chestLabel: "KITTY",
    arrive: "房間正中央，放著一個寫著「KITTY」的木頭寶箱……",
    title: "終極寶藏：實體戒指",
    /** 戒指特寫預設是卡通圖；想改成真實照片，填 '/ring.png'（照片已放在 public/ 裡） */
    photo: "",
    engraving: "YOU'VE GOT A FRIEND IN ME",
    /** 打開寶箱時播放的背景音樂：把音樂檔放進 public/，例如 public/friend-in-me.mp3 */
    music: {
      src: "/friend-in-me.mp3",
      /** 音量 0～1 */
      volume: 0.5,
      /** true = 循環播放；false = 只播一次 */
      loop: true,
    },
    /** 寶箱裡的信 */
    letter: {
      greeting: `Hi ${HER}：`,
      paragraphs: [
        "北鼻!生日快樂! 今天的妳有沒有快樂?",
        "23歲對你來說，可能不是一個值得開心的一年，或許還會是你人生中最黑暗的一年，可能也有很多妳想一被子遺忘的痛苦記憶，但這些都要過去了，在妳最痛苦的時候，不知道我有沒有帶給妳一點快樂，還記得當初發生意外的時候，我都是自己先整理好情緒，再踏進病房，我應該藏得很好吧?",
        "今天就把它當作是痛苦的結束，更好的未來就要來囉!!等妳正式開完刀、修復好後我們就規劃出國旅行!如果妳有假的話....",
        "妳的趙雨凡我也是花重金聘請來了，有沒有厲害，雨璇想要，雨璇得到!",
        "另外，雖然我很常說妳要找一個條件比我好的男人才行，但要是哪天你腦子壞掉要跟8+9在一起，我也會支持啦!畢竟我還在!我會讓你一直快樂!",
        "在最後的戒指，上面剛好也有刻【You've Got a Friend in Me】我覺得這首歌，也很符合我們的友誼，當下一看到就決定要買來送妳，我自己也有一個喔!這個IS FOR U的公開網站是專屬於你的喔!雖然有點潦草，明年會精進! HAPPY BIRTHDAY!Love U !",
      ],
      signature: `—— ${ME}`,
    },
    closing: "現在，可以抬頭向我領取你的禮物囉！",
  },

  /** 結尾：下一個篇章（明年揭曉） */
  sequel: {
    button: "看下集預告 ▶",
    kicker: "NEXT CHAPTER",
    title: `${HER}的玩具總動員`,
    number: "2",
    tagline: "冒險還沒結束……明年，新的玩具、新的寶箱，正在路上。",
    /** 揭曉日期（YYYY-MM-DD），畫面會倒數剩下幾天 */
    revealDate: "2027-10-19",
    /** 下一章的預告：畫面上會霧化看不清楚，可以偷偷寫真正的線索 */
    teasers: [
      "下一站：一起去更遠的地方",
      "新的寶箱，新的禮物",
      "一個還沒說出口的驚喜",
    ],
    motto: "飛向宇宙，浩瀚無垠！",
  },
};

export type ToyContent = typeof toy;

/** 是否還是待填的佔位文字 */
export const isTodo = (text: string) => text.includes("【待填");
