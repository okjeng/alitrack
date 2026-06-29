import { IconBack } from "../components/ui/index.jsx";

export const TermsScreen = ({ onBack }) => (
  <div className="pb-10">
    <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm px-4 pt-4 pb-3 flex items-center gap-3 border-b border-gray-100">
      <button onClick={onBack} className="w-9 h-9 rounded-xl bg-[#F7F7F8] flex items-center justify-center text-gray-700 active:bg-gray-200 transition flex-shrink-0">
        <IconBack />
      </button>
      <p className="text-base font-bold text-gray-900">이용약관</p>
    </div>
    <div className="px-5 py-5 space-y-6 text-gray-700">
      <p className="text-xs text-gray-400">시행일: 2026년 1월 1일</p>
      {[
        { title:"제1조 (목적)", body:"이 약관은 AliTrack이 제공하는 알리익스프레스 가격 추적 및 핫딜 정보 서비스의 이용 조건 및 절차, 이용자와 서비스 간의 권리·의무 및 책임사항을 규정함을 목적으로 합니다." },
        { title:"제2조 (서비스의 내용)", body:"• 알리익스프레스 상품 가격 변동 추적 및 분석 정보\n• 실시간 핫딜 및 할인 정보 제공\n• 관심 상품 저장 및 최저가 알림\n• 알리익스프레스 제휴 링크를 통한 구매 연결\n\n※ 서비스는 가격 정보 제공 플랫폼이며, 직접 판매 또는 거래의 당사자가 아닙니다." },
        { title:"제3조 (가격 정보 면책)", body:"① 제공하는 가격 정보는 수집 시점 기준이며 알리익스프레스 실시간 가격과 다를 수 있습니다.\n② 최종 구매 가격은 알리익스프레스 앱·웹에서 반드시 재확인하시기 바랍니다.\n③ 가격 정보 오차로 인한 구매 손실에 대해 서비스는 법적 책임을 지지 않습니다." },
        { title:"제4조 (제휴 수수료 안내)", body:"① 서비스는 알리익스프레스 공식 제휴(Affiliate) 프로그램에 참여하고 있습니다.\n② 서비스 내 링크를 통해 상품을 구매하는 경우 구매 금액의 일부가 제휴 수수료로 지급될 수 있습니다.\n③ 이 수수료는 구매자에게 추가 비용을 발생시키지 않으며 서비스 운영 및 고도화에 사용됩니다.\n④ 위 사항은 공정거래위원회 추천·보증 등에 관한 표시·광고 심사지침을 준수하여 고지합니다." },
        { title:"제5조 (이용자 의무)", body:"다음 행위를 해서는 안 됩니다.\n• 서비스의 정보를 상업적 목적으로 무단 수집·재배포\n• 자동화 도구(봇, 크롤러)를 이용한 대량 데이터 수집\n• 타인의 계정 도용 또는 허위 정보 등록" },
        { title:"제6조 (서비스 중단 및 변경)", body:"① 시스템 점검, 서버 장애, 외부 API 변경 등으로 일시 중단될 수 있습니다.\n② 서비스 내용 변경 시 7일 전 앱 내 공지를 원칙으로 합니다." },
        { title:"제7조 (준거법 및 분쟁 해결)", body:"① 이 약관은 대한민국 법령에 따라 해석됩니다.\n② 분쟁 협의 불성립 시 서울중앙지방법원을 관할법원으로 합니다." },
      ].map((s,i) => (
        <div key={i} className="space-y-2">
          <p className="text-sm font-extrabold text-gray-900">{s.title}</p>
          <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{s.body}</p>
        </div>
      ))}
    </div>
  </div>
);
