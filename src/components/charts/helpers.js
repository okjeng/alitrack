export const sliceHist = (hist, days) =>
  hist.slice(Math.max(0, hist.length - Math.ceil(days / 4)));

export const calcWeeklyPattern = (basePrice, seed) => {
  const days = ["월","화","수","목","금","토","일"];
  let rng = seed;
  const rand = () => { rng=(rng*1664525+1013904223)&0xffffffff; return (rng>>>0)/0xffffffff; };
  return days.map((d) => {
    const variation = (rand() - 0.5) * 0.12;
    const price = Math.round(basePrice * (1 + variation) / 100) * 100;
    return { day: d, price, isMin: false };
  }).map((d, _, arr) => ({ ...d, isMin: d.price === Math.min(...arr.map(x => x.price)) }));
};

const getBlackFriday = (year) => {
  const nov1 = new Date(year, 10, 1);
  const firstThursday = ((4 - nov1.getDay() + 7) % 7) + 1;
  return new Date(year, 10, firstThursday + 21 + 1);
};

export const calcNextSale = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const y = today.getFullYear();
  const candidates = [
    { name:"6.18 알리 미드이어 세일", emoji:"☀️", maxDisc:60, date: new Date(y,   5, 18) },
    { name:"11.11 솔로데이",          emoji:"🛍", maxDisc:80, date: new Date(y,  10, 11) },
    { name:"블랙프라이데이",           emoji:"🖤", maxDisc:70, date: getBlackFriday(y)    },
    { name:"12.12 더블트웰브",         emoji:"🎁", maxDisc:60, date: new Date(y,  11, 12) },
    { name:"6.18 알리 미드이어 세일", emoji:"☀️", maxDisc:60, date: new Date(y+1, 5, 18) },
    { name:"11.11 솔로데이",          emoji:"🛍", maxDisc:80, date: new Date(y+1,10, 11) },
    { name:"블랙프라이데이",           emoji:"🖤", maxDisc:70, date: getBlackFriday(y+1)  },
    { name:"12.12 더블트웰브",         emoji:"🎁", maxDisc:60, date: new Date(y+1,11, 12) },
  ];
  const upcoming = candidates
    .map(s => ({ ...s, dday: Math.ceil((s.date - today) / 86400000) }))
    .filter(s => s.dday >= 0)
    .sort((a, b) => a.dday - b.dday);
  return upcoming[0];
};

export const buildTimeline = (hist, currentPrice) => {
  const events = [];
  const minP = Math.min(...hist.map(d => d.price));
  const maxP = Math.max(...hist.map(d => d.price));
  const recent = hist.slice(-20).filter((_,i) => i % 3 === 0).slice(-6).reverse();
  recent.forEach((pt, i) => {
    const prev = recent[i + 1];
    const isUp   = prev && pt.price > prev.price;
    const isDown = prev && pt.price < prev.price;
    const isMin  = pt.price === minP;
    const isMax  = pt.price === maxP;
    events.push({
      date:  pt.date,
      price: pt.price,
      label: isMin ? "역대최저" : isMax ? "최고가" : isUp ? "가격상승" : isDown ? "가격하락" : "변동없음",
      color: isMin ? "#EF4444" : isMax ? "#6366F1" : isUp ? "#3B82F6" : isDown ? "#EF4444" : "#9CA3AF",
      icon:  isMin ? "🏆" : isMax ? "📈" : isUp ? "▲" : isDown ? "▼" : "─",
    });
  });
  return events;
};

export const extractKeyword = (name) => {
  const stopWords = ["초소형","접이식","고속","급속","무선","블루투스","스마트","공식","정품","한국","세트","패키지"];
  return (name || "")
    .split(/[\s,·\-\(\)]+/)
    .filter(w => w.length > 1 && !stopWords.includes(w))
    .slice(0, 3)
    .join(" ");
};

export const buildCoupangUrl = (keyword) => {
  const encoded = encodeURIComponent(keyword);
  return `https://www.coupang.com/np/search?q=${encoded}&affiliateCode=AF4860198&sourceType=affiliate&subId=alitrack`;
};
