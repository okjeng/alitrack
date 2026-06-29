export const EmptyWishlist = () => (
  <div className="flex flex-col items-center justify-center py-16 gap-3">
    <span className="text-5xl">💝</span>
    <p className="text-sm font-bold text-gray-700">찜한 상품이 없어요</p>
    <p className="text-xs text-gray-400 text-center">관심 있는 상품을 찜해두면<br />여기서 모아볼 수 있어요</p>
  </div>
);

export const EmptyPriceHistory = () => (
  <div className="flex flex-col items-center justify-center py-16 gap-3">
    <span className="text-5xl">📭</span>
    <p className="text-sm font-bold text-gray-700">조회한 상품이 없어요</p>
    <p className="text-xs text-gray-400 text-center">상품 상세 페이지를 방문하면<br />자동으로 기록이 저장돼요</p>
  </div>
);
