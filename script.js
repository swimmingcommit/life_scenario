// ==========================================
// 인생 떡상 & 나락 테스트 스크립트 (script.js)
// ==========================================

// 1. 애플리케이션 상태
const state = {
  mode: 'narak', // 'narak' | 'tteoksang'
  currentQuestionIndex: 0,
  scores: {},
  trajectory: [50], // 시작 베이스라인
  choiceHistory: [],
  finalResult: null
};

// 2. DOM 요소 참조
const appContainer = document.getElementById('appContainer');

// 화면들
const screenModeSelect = document.getElementById('screenModeSelect');
const screenIntro = document.getElementById('screenIntro');
const screenGame = document.getElementById('screenGame');
const screenLoading = document.getElementById('screenLoading');
const screenResult = document.getElementById('screenResult');

// 인트로 요소
const introIcon = document.getElementById('introIcon');
const introTitle = document.getElementById('introTitle');
const introDesc = document.getElementById('introDesc');
const introModeTag = document.getElementById('introModeTag');

// 게임 요소
const stepIndicator = document.getElementById('stepIndicator');
const stepCounter = document.getElementById('stepCounter');
const progressFill = document.getElementById('progressFill');
const questionText = document.getElementById('questionText');
const optionA = document.getElementById('optionA');
const optionB = document.getElementById('optionB');
const optionAText = document.getElementById('optionAText');
const optionBText = document.getElementById('optionBText');

// 로딩 요소
const loadingSpinnerIcon = document.getElementById('loadingSpinnerIcon');
const loadingTitle = document.getElementById('loadingTitle');
const loadingDesc = document.getElementById('loadingDesc');

// 결과 요소
const resultBadge = document.getElementById('resultBadge');
const resultBadgeIcon = document.getElementById('resultBadgeIcon');
const resultBadgeText = document.getElementById('resultBadgeText');
const resultTitle = document.getElementById('resultTitle');
const resultRank = document.getElementById('resultRank');
const chartTitle = document.getElementById('chartTitle');
const chartTrendRate = document.getElementById('chartTrendRate');
const storySummary = document.getElementById('storySummary');
const storyTimeline = document.getElementById('storyTimeline');
const adviceLabel = document.getElementById('adviceLabel');
const adviceText = document.getElementById('adviceText');
const lifeTrendCanvas = document.getElementById('lifeTrendCanvas');
const toast = document.getElementById('toast');

// 3. 화면 전환 유틸리티
function switchScreen(targetScreen) {
  const allScreens = [screenModeSelect, screenIntro, screenGame, screenLoading, screenResult];
  allScreens.forEach(screen => {
    screen.classList.remove('active');
  });

  setTimeout(() => {
    targetScreen.classList.add('active');
    // 결과창 진입 시 스크롤 맨 위로
    if (targetScreen === screenResult) {
      screenResult.scrollTop = 0;
    }
  }, 50);
}

// 4. 모드 선택
function selectMode(mode) {
  state.mode = mode;
  const config = TEST_DATA[mode];

  // 테마 클래스 설정
  document.body.className = `theme-${mode}`;

  // 인트로 화면 텍스트 바인딩
  introIcon.textContent = mode === 'narak' ? '📉' : '📈';
  introModeTag.textContent = config.modeName;
  introTitle.innerHTML = mode === 'narak' 
    ? `내 인생,<br><span>어디서부터 잘못된 걸까?</span>`
    : `내 인생,<br><span>어떻게 떡상할까?</span>`;
  introDesc.textContent = config.subtitle;

  switchScreen(screenIntro);
}

// 5. 테스트 시작
function startTest() {
  state.currentQuestionIndex = 0;
  state.scores = {};
  state.trajectory = [state.mode === 'narak' ? 70 : 30]; // 나락은 위에서 아래로, 떡상은 아래서 위로
  state.choiceHistory = [];
  state.finalResult = null;

  renderQuestion();
  switchScreen(screenGame);
}

// 6. 질문 렌더링
function renderQuestion() {
  const dataset = TEST_DATA[state.mode];
  const question = dataset.questions[state.currentQuestionIndex];
  const totalQuestions = dataset.questions.length;
  const currentStep = state.currentQuestionIndex + 1;

  // 인디케이터 & 진행률
  stepIndicator.textContent = `Q${currentStep}.`;
  stepCounter.textContent = `${currentStep} / ${totalQuestions}`;
  const progressPercent = ((currentStep - 1) / totalQuestions) * 100;
  progressFill.style.width = `${progressPercent}%`;

  // 질문 내용
  questionText.innerHTML = formatBreaks(question.question);

  // 선택지 바인딩 (세 줄이 되지 않고 정확히 두 줄 가운데 정렬로 렌더링)
  const [optA, optB] = question.options;
  optionAText.innerHTML = formatOptionBreaks(optA.text);
  optionBText.innerHTML = formatOptionBreaks(optB.text);
}

// 7. 선택지 클릭 처리
function selectAnswer(choiceIdx) {
  const dataset = TEST_DATA[state.mode];
  const currentQ = dataset.questions[state.currentQuestionIndex];
  const chosenOpt = currentQ.options[choiceIdx];

  // 점수 누적
  const param = chosenOpt.param;
  state.scores[param] = (state.scores[param] || 0) + chosenOpt.weight;

  if (chosenOpt.extraParam) {
    state.scores[chosenOpt.extraParam] = (state.scores[chosenOpt.extraParam] || 0) + chosenOpt.weight;
  }

  // 궤적 누적
  const lastVal = state.trajectory[state.trajectory.length - 1];
  const nextVal = Math.max(5, Math.min(98, lastVal + chosenOpt.delta));
  state.trajectory.push(nextVal);

  // 선택 이력 (파라미터 포함 저장하여 타이 브레이커에 활용)
  state.choiceHistory.push({
    q: currentQ.question,
    ans: chosenOpt.text,
    param: chosenOpt.param
  });

  // 다음 질문 또는 결과 생성으로 이동
  state.currentQuestionIndex++;
  if (state.currentQuestionIndex < dataset.questions.length) {
    // 부드러운 전환 효과
    screenGame.style.opacity = '0.5';
    setTimeout(() => {
      renderQuestion();
      screenGame.style.opacity = '1';
    }, 150);
  } else {
    // 100% 프로그레스
    progressFill.style.width = '100%';
    setTimeout(startLoadingSequence, 300);
  }
}

// 8. 극적 로딩 시퀀스
function startLoadingSequence() {
  const dataset = TEST_DATA[state.mode];
  switchScreen(screenLoading);

  loadingSpinnerIcon.textContent = state.mode === 'narak' ? '💀' : '⚡';

  let titleIndex = 0;
  loadingTitle.textContent = dataset.loadingTitles[titleIndex];
  loadingDesc.textContent = state.mode === 'narak' 
    ? '내가 누른 선택들이 만들어낸 파국 엔딩 계산 중...' 
    : '내가 누른 똘기들이 만들어낸 대박 엔딩 계산 중...';

  const intervalId = setInterval(() => {
    titleIndex++;
    if (titleIndex < dataset.loadingTitles.length) {
      loadingTitle.textContent = dataset.loadingTitles[titleIndex];
    }
  }, 700);

  setTimeout(() => {
    clearInterval(intervalId);
    calculateAndShowResult();
  }, 2300);
}

// 9. 결과 계산 및 결과 화면 표시 (동점 버그 해결 및 정밀 판정)
function calculateAndShowResult() {
  const dataset = TEST_DATA[state.mode];

  // 1. 점수 내림차순 정렬
  const scoreEntries = Object.entries(state.scores).sort((a, b) => b[1] - a[1]);
  
  let resultKey = '';

  if (scoreEntries.length > 0) {
    const maxScore = scoreEntries[0][1];
    // 최고 점수를 기록한 파라미터 후보군
    const candidates = scoreEntries.filter(entry => entry[1] === maxScore).map(entry => entry[0]);

    if (candidates.length === 1) {
      // 명확한 1위가 있을 때
      resultKey = candidates[0];
    } else {
      // 2개 이상 동점일 때: 가장 최근(마지막 문항들)에 유저가 직접 선택한 파라미터를 우선 반영하여 개별 결과 도출
      let resolved = false;
      for (let i = state.choiceHistory.length - 1; i >= 0; i--) {
        const chosenParam = state.choiceHistory[i].param;
        if (candidates.includes(chosenParam)) {
          resultKey = chosenParam;
          resolved = true;
          break;
        }
      }
      if (!resolved) {
        resultKey = candidates[0];
      }
    }
  }

  // 매핑 데이터 확인 (없으면 첫 번째 결과로 안전 폴백)
  const resultData = dataset.results[resultKey] || Object.values(dataset.results)[0];
  state.finalResult = resultData;

  // 결과 화면 바인딩
  resultBadgeIcon.textContent = dataset.badgeIcon;
  resultBadgeText.textContent = dataset.badgeText;
  resultTitle.innerHTML = formatBreaks(resultData.title);
  resultRank.textContent = resultData.rank;

  chartTitle.textContent = dataset.chartTitle;
  const trendSign = resultData.finalTrend > 0 ? `+${resultData.finalTrend}%` : `${resultData.finalTrend}%`;
  chartTrendRate.textContent = trendSign;
  const storyCardTitle = document.getElementById('storyCardTitle');
  if (storyCardTitle) {
    storyCardTitle.textContent = '📌 2056년, 내 인생은';
  }

  storySummary.innerHTML = formatBreaks(resultData.summary);

  // 타임라인 생성
  storyTimeline.innerHTML = '';
  resultData.story.forEach(line => {
    const item = document.createElement('div');
    item.className = 'timeline-item';
    item.innerHTML = formatBreaks(line);
    storyTimeline.appendChild(item);
  });

  // 조언
  adviceLabel.innerHTML = dataset.adviceIcon;
  adviceText.innerHTML = formatBreaks(resultData.advice);

  // 구글 AI Plus 대학생 혜택 배너 문구 바인딩
  const resultCtaTitle = document.getElementById('resultCtaTitle');
  const resultCtaBadge = document.getElementById('resultCtaBadge');
  if (resultCtaTitle) {
    if (state.mode === 'narak') {
      resultCtaTitle.innerHTML = '인생 나락 막고 싶다면?<br>구글 AI Plus 무료 혜택으로 갓생 시작하기';
      if (resultCtaBadge) resultCtaBadge.textContent = '🛟 나락 방지 치트키';
    } else {
      resultCtaTitle.innerHTML = "인생 떡상 도와줄<br>'구글 AI Plus 무료 혜택' 받으러 가기";
      if (resultCtaBadge) resultCtaBadge.textContent = '🚀 떡상 가속 부스터';
    }
  }

  switchScreen(screenResult);

  // 차트 렌더링
  setTimeout(() => {
    renderLifeTrendChart();
  }, 100);
}

// 10. 인터랙티브 주식/롤러코스터 인생 차트 렌더링 (볼드 펜선 낙서풍 Canvas)
function renderLifeTrendChart() {
  const canvas = lifeTrendCanvas;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = rect.height;
  const padding = { top: 30, bottom: 30, left: 40, right: 40 };

  const points = state.trajectory;
  const stepX = (w - padding.left - padding.right) / (points.length - 1);

  const getY = (val) => {
    return h - padding.bottom - (val / 100) * (h - padding.top - padding.bottom);
  };

  ctx.clearRect(0, 0, w, h);

  // 1. 연필 스케치 느낌의 가이드 점선
  ctx.strokeStyle = 'rgba(26, 26, 26, 0.12)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 5]);

  [25, 50, 75].forEach(level => {
    const y = getY(level);
    ctx.beginPath();
    ctx.moveTo(padding.left - 10, y);
    ctx.lineTo(w - padding.right + 10, y);
    ctx.stroke();
  });
  ctx.setLineDash([]);

  // 2. 부드러운 곡선 좌표
  const coordinates = points.map((p, i) => ({
    x: padding.left + i * stepX,
    y: getY(p)
  }));

  // 형광펜 칠한 듯한 영역 채우기
  const areaGradient = ctx.createLinearGradient(0, padding.top, 0, h - padding.bottom);
  if (state.mode === 'narak') {
    areaGradient.addColorStop(0, 'rgba(255, 71, 87, 0.28)');
    areaGradient.addColorStop(1, 'rgba(255, 71, 87, 0.02)');
  } else {
    areaGradient.addColorStop(0, 'rgba(34, 197, 94, 0.28)');
    areaGradient.addColorStop(1, 'rgba(34, 197, 94, 0.02)');
  }

  // 곡선 영역 채우기
  ctx.beginPath();
  ctx.moveTo(coordinates[0].x, coordinates[0].y);
  for (let i = 0; i < coordinates.length - 1; i++) {
    const p0 = coordinates[i];
    const p1 = coordinates[i + 1];
    const midX = (p0.x + p1.x) / 2;
    ctx.bezierCurveTo(midX, p0.y, midX, p1.y, p1.x, p1.y);
  }
  ctx.save();
  ctx.lineTo(coordinates[coordinates.length - 1].x, h - padding.bottom);
  ctx.lineTo(coordinates[0].x, h - padding.bottom);
  ctx.closePath();
  ctx.fillStyle = areaGradient;
  ctx.fill();
  ctx.restore();

  // 굵은 네임펜 잉크 라인
  ctx.beginPath();
  ctx.moveTo(coordinates[0].x, coordinates[0].y);
  for (let i = 0; i < coordinates.length - 1; i++) {
    const p0 = coordinates[i];
    const p1 = coordinates[i + 1];
    const midX = (p0.x + p1.x) / 2;
    ctx.bezierCurveTo(midX, p0.y, midX, p1.y, p1.x, p1.y);
  }
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 4.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();

  // 3. 손그림 원형 포인트 & 말풍선 뱃지
  coordinates.forEach((pt, idx) => {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, idx === coordinates.length - 1 ? 7 : 5, 0, Math.PI * 2);
    ctx.fillStyle = idx === coordinates.length - 1 ? (state.mode === 'narak' ? '#ff4757' : '#2ed573') : '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.textAlign = 'center';

    if (idx === 0) {
      ctx.font = "800 11px 'HG꼬딕씨', 'Pretendard', sans-serif";
      ctx.fillStyle = '#4b4b4b';
      ctx.fillText('시작', pt.x, pt.y - 12);
    } else if (idx === coordinates.length - 1) {
      // 최종 낙서 뱃지
      ctx.font = "900 12px 'HG꼬딕씨', 'Pretendard', sans-serif";
      const endTag = state.mode === 'narak' ? '💀 파국' : '🚀 떡상';
      
      // 노란색 미니 스티커 박스
      ctx.fillStyle = '#ffe600';
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 1.5;
      roundRect(ctx, pt.x - 26, pt.y - 32, 52, 22, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#1a1a1a';
      ctx.fillText(endTag, pt.x, pt.y - 17);
    }
  });
}

// 11. 인스타그램 스토리(9:16) 인스타툰/웹툰 컷 스타일 고해상도 카드 생성 및 PNG 다운로드
async function downloadStoryCard() {
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch (e) {
      console.warn('Font readiness wait error:', e);
    }
  }

  const storyCanvas = document.createElement('canvas');
  storyCanvas.width = 1080;
  storyCanvas.height = 1920;
  const ctx = storyCanvas.getContext('2d');

  const mode = state.mode;
  const isNarak = mode === 'narak';
  const result = state.finalResult;

  // A. 스케치북 화이트 배경
  ctx.fillStyle = '#faf9f5';
  ctx.fillRect(0, 0, 1080, 1920);

  // 미세한 모눈종이 도트 패턴
  ctx.fillStyle = '#e8e5dc';
  for (let x = 40; x < 1040; x += 40) {
    for (let y = 40; y < 1880; y += 40) {
      ctx.fillRect(x, y, 2.5, 2.5);
    }
  }

  // B. 볼드 웹툰 만화 외곽 프레임
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 14;
  roundRect(ctx, 36, 36, 1008, 1848, 40);
  ctx.stroke();

  // 내부 얇은 보조 라인
  ctx.lineWidth = 3;
  roundRect(ctx, 50, 50, 980, 1820, 30);
  ctx.stroke();

  // C. 헤더 상단 스티커 태그
  ctx.save();
  ctx.translate(540, 150);
  ctx.rotate(-0.02);
  
  // 스티커 그림자 & 본체
  ctx.fillStyle = '#1a1a1a';
  roundRect(ctx, -260, -35, 520, 70, 20);
  ctx.fill();

  ctx.fillStyle = '#ffe600';
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 4;
  roundRect(ctx, -265, -42, 520, 70, 20);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.font = "900 32px 'HG꼬딕씨', 'Pretendard', sans-serif";
  ctx.fillStyle = '#1a1a1a';
  const modeBadgeText = isNarak ? '⚡ 인생 나락 7단계 시나리오' : '⚡ 인생 떡상 7단계 시나리오';
  ctx.fillText(modeBadgeText, -5, 8);
  ctx.restore();

  // D. 등급 서브 타이틀
  ctx.textAlign = 'center';
  ctx.font = "800 30px 'HG꼬딕씨', 'Pretendard', sans-serif";
  ctx.fillStyle = '#4b4b4b';
  ctx.fillText(`[ ${result.rank} ]`, 540, 270);

  // E. 메인 결과 타이틀 (형광펜 박스 + 볼드 폰트)
  ctx.font = "900 58px 'HG꼬딕씨', 'Pretendard', sans-serif";
  ctx.fillStyle = '#1a1a1a';
  wrapText(ctx, result.title, 540, 360, 920, 75);

  // F. 인생 그래프 박스 (인스타툰 컷 스타일)
  const chartBoxY = 490;
  const chartBoxH = 470;
  
  // 그림자
  ctx.fillStyle = '#1a1a1a';
  roundRect(ctx, 88, chartBoxY + 8, 904, chartBoxH, 28);
  ctx.fill();

  // 본체
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 6;
  roundRect(ctx, 80, chartBoxY, 904, chartBoxH, 28);
  ctx.fill();
  ctx.stroke();

  // 차트 헤더
  ctx.textAlign = 'left';
  ctx.font = "900 34px 'HG꼬딕씨', 'Pretendard', sans-serif";
  ctx.fillStyle = '#1a1a1a';
  ctx.fillText(`📊 ${TEST_DATA[mode].chartTitle}`, 125, chartBoxY + 65);

  ctx.textAlign = 'right';
  ctx.font = "900 40px 'HG꼬딕씨', 'Pretendard', sans-serif";
  ctx.fillStyle = isNarak ? '#ff3344' : '#059669';
  const trendSign = result.finalTrend > 0 ? `+${result.finalTrend}%` : `${result.finalTrend}%`;
  ctx.fillText(trendSign, 940, chartBoxY + 65);

  // 차트 궤적 렌더링
  drawChartOnStory(ctx, 130, chartBoxY + 110, 804, 300, state.trajectory, isNarak);

  // G. 썰 타임라인 박스
  const storyBoxY = 1000;
  const storyBoxH = 480;

  // 그림자
  ctx.fillStyle = '#1a1a1a';
  roundRect(ctx, 88, storyBoxY + 8, 904, storyBoxH, 28);
  ctx.fill();

  // 본체
  ctx.fillStyle = '#faf9f5';
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 5;
  roundRect(ctx, 80, storyBoxY, 904, storyBoxH, 28);
  ctx.fill();
  ctx.stroke();

  // 썰 박스 타이틀 태그
  ctx.save();
  ctx.fillStyle = '#ffe600';
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 3;
  roundRect(ctx, 115, storyBoxY + 30, 460, 52, 12);
  ctx.fill();
  ctx.stroke();
  
  ctx.textAlign = 'left';
  ctx.font = "900 28px 'HG꼬딕씨', 'Pretendard', sans-serif";
  ctx.fillStyle = '#1a1a1a';
  ctx.fillText('📌 2056년, 내 인생은', 135, storyBoxY + 66);
  ctx.restore();

  ctx.font = "700 28px 'HG꼬딕씨', 'Pretendard', sans-serif";
  ctx.fillStyle = '#2d3436';
  
  let textY = storyBoxY + 140;
  result.story.forEach(line => {
    wrapText(ctx, line, 125, textY, 810, 42);
    textY += 78;
  });

  // H. 조언/명언 말풍선 박스
  const adviceBoxY = 1520;
  const adviceBoxH = 210;

  // 그림자
  ctx.fillStyle = '#1a1a1a';
  roundRect(ctx, 88, adviceBoxY + 8, 904, adviceBoxH, 26);
  ctx.fill();

  // 본체 (스티커/메모지 스타일)
  ctx.fillStyle = '#fffbe6';
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 5;
  roundRect(ctx, 80, adviceBoxY, 904, adviceBoxH, 26);
  ctx.fill();
  ctx.stroke();

  // 마스킹 테이프 장식
  ctx.fillStyle = '#fed330';
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 2.5;
  roundRect(ctx, 470, adviceBoxY - 14, 140, 30, 4);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.font = "900 28px 'HG꼬딕씨', 'Pretendard', sans-serif";
  ctx.fillStyle = '#1a1a1a';
  ctx.fillText(TEST_DATA[mode].adviceIcon, 120, adviceBoxY + 60);

  ctx.font = "800 30px 'HG꼬딕씨', 'Pretendard', sans-serif";
  ctx.fillStyle = '#1a1a1a';
  wrapText(ctx, `"${result.advice}"`, 120, adviceBoxY + 120, 820, 46);

  // I. 푸터 (인스타툰 계정 및 링크 유도)
  ctx.textAlign = 'center';
  ctx.font = "900 32px 'HG꼬딕씨', 'Pretendard', sans-serif";
  ctx.fillStyle = '#1a1a1a';
  ctx.fillText('🔗 프로필 링크에서 내 인생 그래프 확인하기', 540, 1795);

  ctx.font = "700 24px 'HG꼬딕씨', 'Pretendard', sans-serif";
  ctx.fillStyle = '#767676';
  ctx.fillText('인생 떡상 & 나락 7단계 시나리오 테스트', 540, 1845);

  // 다운로드 트리거
  const link = document.createElement('a');
  link.download = `인생_${mode === 'narak' ? '나락' : '떡상'}_인스타툰_카드.png`;
  link.href = storyCanvas.toDataURL('image/png');
  link.click();

  showToast('📸 인스타툰 스타일 카드가 저장되었습니다!');
}

// 스토리 캔버스 차트 그리기
function drawChartOnStory(ctx, x, y, width, height, points, isNarak) {
  const stepX = width / (points.length - 1);
  const getY = (val) => y + height - (val / 100) * height;

  const coords = points.map((p, i) => ({
    x: x + i * stepX,
    y: getY(p)
  }));

  // 형광펜 채우기
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(coords[0].x, coords[0].y);
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i];
    const p1 = coords[i + 1];
    const midX = (p0.x + p1.x) / 2;
    ctx.bezierCurveTo(midX, p0.y, midX, p1.y, p1.x, p1.y);
  }
  ctx.lineTo(coords[coords.length - 1].x, y + height);
  ctx.lineTo(coords[0].x, y + height);
  ctx.closePath();
  ctx.fillStyle = isNarak ? 'rgba(255, 71, 87, 0.22)' : 'rgba(34, 197, 94, 0.22)';
  ctx.fill();
  ctx.restore();

  // 굵은 잉크 라인
  ctx.beginPath();
  ctx.moveTo(coords[0].x, coords[0].y);
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i];
    const p1 = coords[i + 1];
    const midX = (p0.x + p1.x) / 2;
    ctx.bezierCurveTo(midX, p0.y, midX, p1.y, p1.x, p1.y);
  }
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();

  // 볼드 포인트
  coords.forEach((pt, idx) => {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, idx === coords.length - 1 ? 16 : 10, 0, Math.PI * 2);
    ctx.fillStyle = idx === coords.length - 1 ? (isNarak ? '#ff4757' : '#2ed573') : '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 5;
    ctx.stroke();
  });
}

// 텍스트 줄바꿈 헬퍼
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}

// 쉼표(,) 및 마침표(.) 기준 줄바꿈 헬퍼
function formatBreaks(text) {
  if (!text) return '';
  // 1. 쉼표 뒤 공백: ', ' -> ',<br>'
  let res = text.replace(/,\s+/g, ',<br>');
  // 2. 느낌표/물음표 뒤 공백
  res = res.replace(/([!?]["'”’]?)\s+/g, '$1<br>');
  // 3. 문장 끝 마침표(.) 뒤 공백 (단, 시작 번호 1. 2. 등은 제외)
  res = res.replace(/([^0-9\s]\.["'”’]?)\s+/g, '$1<br>');
  return res;
}

// 선택지 탭 전용: 세 줄이 되지 않고 정확히 최대 2줄까지만 줄바꿈되도록 첫 번째 쉼표 분할
function formatOptionBreaks(text) {
  if (!text) return '';
  const commaIdx = text.indexOf(',');
  if (commaIdx !== -1) {
    const p1 = text.slice(0, commaIdx + 1).trim();
    const p2 = text.slice(commaIdx + 1).trim();
    return `${p1}<br>${p2}`;
  }
  return text;
}

// 둥근 사각형 헬퍼
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// 12. 링크 공유 및 토스트
function shareResult() {
  const shareTitle = `내 인생 결과: ${state.finalResult?.title || '인생 떡상 & 나락 테스트'}`;
  const shareUrl = window.location.href;

  if (navigator.share) {
    navigator.share({
      title: shareTitle,
      text: `사소한 선택이 만든 끔찍한 나비효과! 당신의 인생 궤적도 확인해보세요.`,
      url: shareUrl
    }).catch(() => {
      copyToClipboard(shareUrl);
    });
  } else {
    copyToClipboard(shareUrl);
  }
}

function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('🔗 테스트 링크가 복사되었습니다!');
    });
  } else {
    showToast('🔗 테스트 링크가 복사되었습니다!');
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2300);
}

// 13. 홈으로 초기화
function resetToHome() {
  state.mode = 'narak';
  document.body.className = 'theme-narak';
  switchScreen(screenModeSelect);
}

// 브라우저 리사이즈 시 차트 재계산
window.addEventListener('resize', () => {
  if (screenResult.classList.contains('active')) {
    renderLifeTrendChart();
  }
});
