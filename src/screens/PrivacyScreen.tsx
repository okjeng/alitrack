import { IconBack } from "../components/ui/index";

interface PrivacyScreenProps { onBack: () => void; }

export const PrivacyScreen = ({ onBack }: PrivacyScreenProps) => (
  <div className="pb-10">
    <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm px-4 pt-4 pb-3 flex items-center gap-3 border-b border-gray-100">
      <button onClick={onBack} className="w-9 h-9 rounded-xl bg-[#F7F7F8] flex items-center justify-center text-gray-700 active:bg-gray-200 transition flex-shrink-0">
        <IconBack />
      </button>
      <p className="text-base font-bold text-gray-900">개인정보처리방침</p>
    </div>
    <div className="px-5 py-5 space-y-6 text-gray-700">
      <p className="text-xs text-gray-400">시행일: 2026년 1월 1일 · 최종 수정: 2026년 6월 27일</p>
      {[
        { title:"1. 개인정보 수집 항목 및 목적", body:"AliTrack(이하 \"서비스\")은 아래와 같은 목적으로 최소한의 개인정보를 수집합니다.\n\n• 이메일 회원가입: 이메일 주소, 비밀번호(암호화 저장)\n• 서비스 이용: 관심 상품 목록, 알림 설정 정보, 서비스 이용 기록\n\n수집 목적: 회원 식별, 최저가 알림 발송, 찜 목록 및 가격 기록 보관, 서비스 품질 개선" },
        { title:"2. 개인정보 보유 및 이용 기간", body:"• 회원 탈퇴 시 즉시 파기\n• 전자상거래법: 계약·청약철회 기록 5년, 대금결제 기록 5년\n• 통신비밀보호법: 로그인 기록 3개월" },
        { title:"3. 개인정보 제3자 제공", body:"서비스는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다.\n단, 이용자가 사전에 동의한 경우 또는 법령의 규정에 의한 경우 예외로 합니다.\n\n※ 알리익스프레스 제휴 링크 클릭 시 해당 사이트의 개인정보처리방침이 적용됩니다." },
        { title:"4. 개인정보 처리 위탁", body:"• Supabase Inc. — 데이터베이스 저장 및 관리\n• Cloudflare Inc. — 웹 서비스 호스팅 (Cloudflare Pages)\n• Railway Corp. — 백엔드 서버 호스팅" },
        { title:"5. 이용자 권리", body:"이용자는 언제든지 개인정보 열람·수정·삭제·처리정지를 요청할 수 있습니다.\n행사 방법: 앱 내 [나의기록 → 계정 설정] 또는 privacy@alitrack.kr 로 요청\n\n• 개인정보분쟁조정위원회: www.kopico.go.kr (1833-6972)\n• 개인정보침해신고센터: privacy.kisa.or.kr (118)" },
        { title:"6. 쿠키 및 분석 도구", body:"• Google Analytics 4: 서비스 이용 통계 분석(익명 처리)\n브라우저 설정에서 쿠키를 거부할 수 있으나 일부 기능이 제한될 수 있습니다." },
        { title:"7. 개인정보 보호책임자", body:"이메일: privacy@alitrack.kr\n본 방침은 개인정보보호법, 정보통신망법 등 관련 법령을 준수하여 작성되었습니다." },
      ].map((s,i) => (
        <div key={i} className="space-y-2">
          <p className="text-sm font-extrabold text-gray-900">{s.title}</p>
          <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{s.body}</p>
        </div>
      ))}
    </div>
  </div>
);
