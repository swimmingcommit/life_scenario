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
const loadingVideo = document.getElementById('loadingVideo');
const loadingTitle = document.getElementById('loadingTitle');
const loadingDesc = document.getElementById('loadingDesc');

// 결과 요소
const resultBadge = document.getElementById('resultBadge');
const resultBadgeIcon = document.getElementById('resultBadgeIcon');
const resultBadgeText = document.getElementById('resultBadgeText');
const resultImage = document.getElementById('resultImage');
const resultImageWrapper = document.getElementById('resultImageWrapper');
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

  if (targetScreen !== screenLoading && loadingVideo && !loadingVideo.paused) {
    loadingVideo.pause();
  }

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
  playCoinSfx();
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

// 배열 랜덤 셔플 함수 (Fisher-Yates)
function shuffleQuestions(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 5. 테스트 시작 (이용자마다 7문항 랜덤 셔플 출제)
function startTest() {
  const dataset = TEST_DATA[state.mode];
  state.currentQuestionIndex = 0;
  state.scores = {};
  state.trajectory = [state.mode === 'narak' ? 70 : 30]; // 나락은 위에서 아래로, 떡상은 아래서 위로
  state.choiceHistory = [];
  state.finalResult = null;

  // 이용자마다 매번 7문항을 랜덤 셔플하여 출제
  state.activeQuestions = shuffleQuestions(dataset.questions).slice(0, 7);

  renderQuestion();
  switchScreen(screenGame);
}

// 6. 질문 렌더링
function renderQuestion() {
  const question = state.activeQuestions[state.currentQuestionIndex];
  const totalQuestions = state.activeQuestions.length;
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
  const currentQ = state.activeQuestions[state.currentQuestionIndex];
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
  if (state.currentQuestionIndex < state.activeQuestions.length) {
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

  if (loadingSpinnerIcon) {
    loadingSpinnerIcon.textContent = state.mode === 'narak' ? '💀' : '⚡';
  }

  // 비디오 재생 및 소리 활성화
  if (loadingVideo) {
    loadingVideo.currentTime = 0;
    loadingVideo.muted = false; // 소리 정상 재생
    loadingVideo.volume = 1.0;
    const playPromise = loadingVideo.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        console.warn('Autoplay with sound prevented by browser policy:', err);
        // 브라우저 정책 대응: 음소거로 안전 재생 시도
        loadingVideo.muted = true;
        loadingVideo.play().catch(e => console.error('Video play error:', e));
      });
    }
  }

  let titleIndex = 0;
  loadingTitle.textContent = dataset.loadingTitles[titleIndex];
  loadingDesc.textContent = state.mode === 'narak' 
    ? '사소하게 고른 답들이 어디까지 일을 키우나 보는 중...' 
    : '별생각 없이 고른 답들이 어디까지 대박 나는지 보는 중...';

  // 4개 타이틀이 약 10초 영상 동안 자연스럽게 전환되도록 간격 조절 (~2.2초)
  const intervalId = setInterval(() => {
    titleIndex++;
    if (titleIndex < dataset.loadingTitles.length) {
      loadingTitle.textContent = dataset.loadingTitles[titleIndex];
    }
  }, 2200);

  let finished = false;
  const finishLoading = () => {
    if (finished) return;
    finished = true;
    clearInterval(intervalId);
    if (loadingVideo) {
      loadingVideo.removeEventListener('ended', finishLoading);
      loadingVideo.pause();
    }
    calculateAndShowResult();
  };

  if (loadingVideo) {
    loadingVideo.addEventListener('ended', finishLoading, { once: true });
    // 영상이 약 10초이므로, 영상 종료 시 또는 10.5초 경과 시 안전하게 결과 화면으로 전환
    setTimeout(finishLoading, 10500);
  } else {
    setTimeout(finishLoading, 2300);
  }
}

// 9. 결과 계산 및 결과 화면 표시 (동점 버그 해결 및 정밀 판정)
function calculateAndShowResult() {
  if (loadingVideo && !loadingVideo.paused) {
    loadingVideo.pause();
  }
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
  if (resultBadgeIcon) {
    resultBadgeIcon.textContent = '';
    resultBadgeIcon.style.display = 'none';
  }
  if (resultBadgeText) {
    resultBadgeText.textContent = '2056년 내 인생은... ';
  }

  // 결과 이미지 바인딩 (배지 아래, 타이틀 위)
  if (resultImage) {
    if (resultData.image) {
      resultImage.style.display = 'block';
      if (resultImageWrapper) resultImageWrapper.style.display = 'flex';
      resultImage.src = resultData.image;
      resultImage.alt = resultData.title || '결과 이미지';
      resultImage.onerror = function() {
        this.style.display = 'none';
        if (resultImageWrapper) resultImageWrapper.style.display = 'none';
      };
    } else {
      resultImage.style.display = 'none';
      if (resultImageWrapper) resultImageWrapper.style.display = 'none';
    }
  }

  resultTitle.innerHTML = formatBreaks(resultData.title);
  if (resultRank) {
    resultRank.textContent = resultData.rank;
  }

  if (chartTitle) chartTitle.textContent = dataset.chartTitle;
  const trendSign = resultData.finalTrend > 0 ? `+${resultData.finalTrend}%` : `${resultData.finalTrend}%`;
  if (chartTrendRate) chartTrendRate.textContent = trendSign;
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
      resultCtaTitle.innerHTML = '이대로 나락 갈 순 없다면?<br>구글 AI Plus 무료 혜택으로 갓생 시동 걸기';
      if (resultCtaBadge) resultCtaBadge.textContent = '🛟 나락 탈출 치트키';
    } else {
      resultCtaTitle.innerHTML = "이 떡상, 현실로 만들고 싶다면?<br>구글 AI Plus 무료 혜택 받으러 가기";
      if (resultCtaBadge) resultCtaBadge.textContent = '🚀 떡상 가속 부스터';
    }
  }

  if (state.mode === 'narak') {
    screenResult.classList.add('is-narak-result');
    document.body.classList.add('is-narak-result');
  } else {
    screenResult.classList.remove('is-narak-result');
    document.body.classList.remove('is-narak-result');
  }

  switchScreen(screenResult);

  // 차트 캔버스가 존재할 때만 렌더링
  if (lifeTrendCanvas) {
    setTimeout(() => {
      renderLifeTrendChart(true);
    }, 120);
  }
}

let chartAnimId = null;

// 10. 인터랙티브 주식/롤러코스터 인생 차트 렌더링 (코믹 브루탈리즘 픽셀 드로잉 Canvas)
function renderLifeTrendChart(animate = true) {
  if (chartAnimId) {
    cancelAnimationFrame(chartAnimId);
    chartAnimId = null;
  }

  const canvas = lifeTrendCanvas;
  if (!canvas || !canvas.parentElement) return;

  const dpr = window.devicePixelRatio || 1;
  const parent = canvas.parentElement;
  const rect = parent.getBoundingClientRect();
  
  const w = Math.max(rect.width || 0, parent.clientWidth || 320);
  const h = Math.max(rect.height || 0, parent.clientHeight || 190);

  canvas.width = w * dpr;
  canvas.height = h * dpr;

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  // 픽셀 렌더링 최적화
  ctx.imageSmoothingEnabled = false;

  const padding = { top: 32, bottom: 32, left: 38, right: 38 };

  // 궤적 데이터 확보 및 안전 폴백
  const points = (state.trajectory && state.trajectory.length >= 2)
    ? state.trajectory
    : (state.mode === 'narak' ? [70, 55, 42, 30, 20, 14, 8, 5] : [30, 44, 56, 68, 78, 86, 92, 98]);

  const stepX = (w - padding.left - padding.right) / Math.max(1, points.length - 1);

  const getY = (val) => {
    const safeVal = (typeof val === 'number' && !isNaN(val)) ? val : 50;
    return h - padding.bottom - (safeVal / 100) * (h - padding.top - padding.bottom);
  };

  const coordinates = points.map((p, i) => ({
    x: padding.left + i * stepX,
    y: getY(p)
  }));

  const duration = animate ? 650 : 0; // 650ms 드로잉 애니메이션
  let startTime = null;

  function drawFrame(currentTime) {
    if (startTime === null) {
      startTime = currentTime;
    }
    const elapsed = Math.max(0, currentTime - startTime);
    const progress = duration === 0 ? 1 : Math.min(1, Math.max(0, elapsed / duration));
    // 톡톡 튀는 만화 느낌의 cubic ease-out
    const eased = Math.max(0, Math.min(1, 1 - Math.pow(1 - progress, 3)));

    ctx.clearRect(0, 0, w, h);

    // 1. 코믹 픽셀 가이드 점선 (그라데이션 없이 순수 블랙/화이트 대비)
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);

    [25, 50, 75].forEach(level => {
      const y = getY(level);
      ctx.beginPath();
      ctx.moveTo(padding.left - 10, y);
      ctx.lineTo(w - padding.right + 10, y);
      ctx.stroke();

      // 수치 픽셀 폰트 라벨
      ctx.setLineDash([]);
      ctx.font = "11px 'MemomentKkukkukk', 'Galmuri11', monospace";
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'right';
      ctx.fillText(`${level}%`, padding.left - 14, y + 3.5);
      ctx.setLineDash([4, 4]);
    });
    ctx.setLineDash([]);

    // 현재 진행률에 따른 드로잉 도달 지점 계산 (인덱스 언더플로우/오버플로우 방어)
    const totalSegments = Math.max(1, coordinates.length - 1);
    const currentProgressPoint = eased * totalSegments;
    const activeSegmentIndex = Math.max(0, Math.min(Math.floor(currentProgressPoint), totalSegments - 1));
    const segmentProgress = Math.max(0, Math.min(1, currentProgressPoint - activeSegmentIndex));

    const p1 = coordinates[activeSegmentIndex] || coordinates[0];
    const p2 = coordinates[Math.min(activeSegmentIndex + 1, totalSegments)] || p1;

    const currentHead = {
      x: p1.x + (p2.x - p1.x) * segmentProgress,
      y: p1.y + (p2.y - p1.y) * segmentProgress
    };

    // 2. 꺾은선 그래프: 굵은 검은색 픽셀 선 (그라데이션 완전 제거)
    ctx.beginPath();
    ctx.moveTo(coordinates[0].x, coordinates[0].y);

    for (let i = 1; i <= activeSegmentIndex; i++) {
      ctx.lineTo(coordinates[i].x, coordinates[i].y);
    }
    if (activeSegmentIndex < totalSegments) {
      ctx.lineTo(currentHead.x, currentHead.y);
    }

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';
    ctx.stroke();

    // 3. 각 노드(데이터 꼭짓점): 하얀색 배경에 굵은 검은색 테두리 원형 (border: 3px solid #000; background: #fff;)
    for (let i = 0; i < coordinates.length; i++) {
      const pt = coordinates[i];
      if (pt.x > currentHead.x + 0.5) continue;

      const isStart = (i === 0);
      const isEnd = (i === coordinates.length - 1);
      const radius = isEnd ? 7 : 5.5;

      ctx.beginPath();
      ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.stroke();

      // 시작/끝점 라벨 (MemomentKkukkukk 폰트)
      if (isStart) {
        ctx.font = "bold 12px 'MemomentKkukkukk', 'Galmuri11', monospace";
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.fillText('START', pt.x, pt.y - 12);
      } else if (isEnd && progress >= 0.98) {
        // 최종 코믹북 옐로우 픽셀 뱃지
        const endTag = state.mode === 'narak' ? '💀 파국' : '🚀 떡상';
        ctx.font = "bold 13px 'MemomentKkukkukk', 'Galmuri14', monospace";
        
        ctx.fillStyle = '#ffe600';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.5;
        // 코믹 브루탈리즘 사각 박스
        ctx.fillRect(pt.x - 30, pt.y - 34, 60, 22);
        ctx.strokeRect(pt.x - 30, pt.y - 34, 60, 22);

        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.fillText(endTag, pt.x, pt.y - 19);
      }
    }

    if (progress < 1) {
      chartAnimId = requestAnimationFrame(drawFrame);
    } else {
      chartAnimId = null;
    }
  }

  chartAnimId = requestAnimationFrame(drawFrame);
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
  const dataset = TEST_DATA[mode];
  const result = state.finalResult;
  if (!result) return;

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

  // B. 볼드 웹툰 만화 외곽 프레임 (9:16 비율)
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 14;
  roundRect(ctx, 36, 36, 1008, 1848, 40);
  ctx.stroke();

  // 내부 얇은 보조 라인
  ctx.lineWidth = 3;
  roundRect(ctx, 50, 50, 980, 1820, 30);
  ctx.stroke();

  // 카드 공통 그리기 함수 (코믹 브루탈리즘 그림자 + 테두리)
  function drawStoryCardBox(x, y, w, h, r = 24) {
    ctx.fillStyle = '#000000';
    roundRect(ctx, x + 8, y + 8, w, h, r);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 6;
    roundRect(ctx, x, y, w, h, r);
    ctx.fill();
    ctx.stroke();
  }

  // ==========================================
  // 1. 상단 결과 메인 카드 (나레이션 + 일러스트 + 결과 타이틀)
  // ==========================================
  const c1X = 75, c1Y = 70, c1W = 930, c1H = 680;
  drawStoryCardBox(c1X, c1Y, c1W, c1H, 24);

  // 1-1. 상단 만화 나레이션 ("2056년 내 인생은...")
  ctx.textAlign = 'center';
  ctx.font = "bold 34px 'MemomentKkukkukk', 'Galmuri14', monospace";
  ctx.fillStyle = '#000000';
  ctx.fillText('2056년 내 인생은...', 540, c1Y + 54);

  // 1-2. 대표 일러스트 이미지 로드 & 중앙 정렬 배치
  let img = document.getElementById('resultImage');
  let imgReady = img && img.complete && img.naturalWidth > 0;
  if (!imgReady && result.image) {
    try {
      img = await new Promise((res) => {
        const temp = new Image();
        temp.crossOrigin = 'anonymous';
        temp.onload = () => res(temp);
        temp.onerror = () => res(null);
        temp.src = result.image;
      });
      imgReady = img && img.complete && img.naturalWidth > 0;
    } catch (e) {
      console.warn('Image load error:', e);
    }
  }

  if (imgReady) {
    const imgSize = 410;
    ctx.drawImage(img, 540 - imgSize / 2, c1Y + 76, imgSize, imgSize);
  }

  // 1-3. 결과 타이틀 (화면 중간 정렬, 최적화 볼드 폰트)
  ctx.font = "bold 46px 'MemomentKkukkukk', 'Galmuri14', monospace";
  ctx.fillStyle = '#000000';
  wrapTextCentered(ctx, result.title, 540, c1Y + 548, 830, 58);

  // ==========================================
  // 2. 썰 & 인과관계 타임라인 카드
  // ==========================================
  const c2X = 75, c2Y = 780, c2W = 930, c2H = 540;
  drawStoryCardBox(c2X, c2Y, c2W, c2H, 24);

  // 2-1. 상단 스티커 태그
  const badgeW = 360, badgeH = 50;
  ctx.fillStyle = '#000000';
  roundRect(ctx, 540 - badgeW / 2 + 4, c2Y + 22 + 4, badgeW, badgeH, 12);
  ctx.fill();

  ctx.fillStyle = '#ffe600';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3.5;
  roundRect(ctx, 540 - badgeW / 2, c2Y + 22, badgeW, badgeH, 12);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.font = "bold 26px 'MemomentKkukkukk', 'Galmuri14', monospace";
  ctx.fillStyle = '#000000';
  ctx.fillText('📌 2056년, 내 인생은', 540, c2Y + 56);

  // 2-2. 요약 멘트 (summary)
  ctx.font = "bold 25px 'MemomentKkukkukk', 'Galmuri11', monospace";
  ctx.fillStyle = '#222222';
  let nextY = wrapTextCentered(ctx, '“' + result.summary + '”', 540, c2Y + 110, 830, 36);

  // 2-3. 구분 점선
  ctx.save();
  ctx.strokeStyle = '#d5d2c8';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(120, nextY + 10);
  ctx.lineTo(960, nextY + 10);
  ctx.stroke();
  ctx.restore();

  // 2-4. 4개 타임라인 목록
  ctx.font = "25px 'MemomentKkukkukk', 'Galmuri11', monospace";
  ctx.fillStyle = '#000000';
  let tY = nextY + 44;
  result.story.forEach((line) => {
    tY = wrapTextLeft(ctx, line, 115, tY, 840, 36) + 18;
  });

  // ==========================================
  // 3. 조언 / 명언 카드
  // ==========================================
  const c3X = 75, c3Y = 1350, c3W = 930, c3H = 240;
  drawStoryCardBox(c3X, c3Y, c3W, c3H, 24);

  // 마스킹 테이프 장식
  ctx.fillStyle = '#ffe600';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.fillRect(470, c3Y - 14, 140, 28);
  ctx.strokeRect(470, c3Y - 14, 140, 28);

  // 조언 라벨 (중앙 정렬)
  ctx.textAlign = 'center';
  ctx.font = "bold 28px 'MemomentKkukkukk', 'Galmuri14', monospace";
  ctx.fillStyle = '#000000';
  ctx.fillText(dataset.adviceIcon, 540, c3Y + 54);

  // 조언 텍스트 (중앙 정렬)
  ctx.font = "bold 29px 'MemomentKkukkukk', 'Galmuri11', monospace";
  ctx.fillStyle = '#000000';
  wrapTextCentered(ctx, '"' + result.advice + '"', 540, c3Y + 116, 830, 44);

  // ==========================================
  // 4. 푸터 (인스타 계정 및 링크 유도)
  // ==========================================
  ctx.textAlign = 'center';
  ctx.font = "bold 30px 'MemomentKkukkukk', 'Galmuri14', monospace";
  ctx.fillStyle = '#000000';
  ctx.fillText('🔗 프로필 링크에서 내 인생 시나리오 확인하기', 540, 1690);

  ctx.font = "23px 'MemomentKkukkukk', 'Galmuri11', monospace";
  ctx.fillStyle = '#555555';
  ctx.fillText('인생 떡상 & 나락 7단계 시나리오 테스트', 540, 1740);

  // 다운로드 트리거
  const link = document.createElement('a');
  link.download = `인생_${mode === 'narak' ? '나락' : '떡상'}_스토리_카드.png`;
  link.href = storyCanvas.toDataURL('image/png');
  link.click();

  showToast('📸 인스타 스토리 카드가 저장되었습니다!');
}

// 스토리 캔버스 차트 그리기 (그라데이션 없이 굵은 픽셀 꺾은선)
function drawChartOnStory(ctx, x, y, width, height, points, isNarak) {
  const stepX = width / (points.length - 1);
  const getY = (val) => y + height - (val / 100) * height;

  const coords = points.map((p, i) => ({
    x: x + i * stepX,
    y: getY(p)
  }));

  // 가이드 라인
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  [25, 50, 75].forEach(lvl => {
    const gy = getY(lvl);
    ctx.beginPath();
    ctx.moveTo(x, gy);
    ctx.lineTo(x + width, gy);
    ctx.stroke();
  });
  ctx.setLineDash([]);

  // 굵은 검은색 픽셀 직선 꺾은선 (그라데이션 제거)
  ctx.beginPath();
  ctx.moveTo(coords[0].x, coords[0].y);
  for (let i = 1; i < coords.length; i++) {
    ctx.lineTo(coords[i].x, coords[i].y);
  }
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 8;
  ctx.lineCap = 'square';
  ctx.lineJoin = 'miter';
  ctx.stroke();

  // 노드 꼭짓점: 하얀색 원 + 굵은 검은색 테두리
  coords.forEach((pt, idx) => {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, idx === coords.length - 1 ? 16 : 11, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#000000';
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
  return y;
}

// 캔버스 중앙 정렬 텍스트 줄바꿈 헬퍼
function wrapTextCentered(ctx, text, cx, startY, maxWidth, lineHeight) {
  if (!text) return startY;
  const cleanText = text.replace(/<br\s*\/?>/gi, '\n');
  const paragraphs = cleanText.split('\n');
  let curY = startY;
  ctx.textAlign = 'center';

  for (const para of paragraphs) {
    const words = para.trim().split(/\s+/);
    let line = '';
    for (let n = 0; n < words.length; n++) {
      const testLine = line ? line + ' ' + words[n] : words[n];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, cx, curY);
        line = words[n];
        curY += lineHeight;
      } else {
        line = testLine;
      }
    }
    if (line) {
      ctx.fillText(line, cx, curY);
      curY += lineHeight;
    }
  }
  return curY;
}

// 캔버스 좌측 정렬 텍스트 줄바꿈 헬퍼
function wrapTextLeft(ctx, text, leftX, startY, maxWidth, lineHeight) {
  if (!text) return startY;
  const cleanText = text.replace(/<br\s*\/?>/gi, '\n');
  const paragraphs = cleanText.split('\n');
  let curY = startY;
  ctx.textAlign = 'left';

  for (const para of paragraphs) {
    const words = para.trim().split(/\s+/);
    let line = '';
    for (let n = 0; n < words.length; n++) {
      const testLine = line ? line + ' ' + words[n] : words[n];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, leftX, curY);
        line = words[n];
        curY += lineHeight;
      } else {
        line = testLine;
      }
    }
    if (line) {
      ctx.fillText(line, leftX, curY);
      curY += lineHeight;
    }
  }
  return curY;
}

// 단어(어절) 및 음절이 깨지지 않으면서 위아래 글자수 비율을 5:5에 가깝게 맞추는 균형 줄바꿈 헬퍼
function splitBalancedLines(text, threshold = 18) {
  if (!text) return '';
  const trimmed = text.trim();
  if (trimmed.length <= threshold) return trimmed;

  const words = trimmed.split(/\s+/);
  if (words.length <= 1) return trimmed;

  const totalLen = trimmed.length;
  const targetHalf = totalLen / 2;

  let bestSplit = 1;
  let minDiff = Infinity;
  let currentLen = 0;

  for (let i = 0; i < words.length - 1; i++) {
    currentLen += words[i].length + (i > 0 ? 1 : 0);
    const diff = Math.abs(currentLen - targetHalf);
    if (diff < minDiff) {
      minDiff = diff;
      bestSplit = i + 1;
    }
  }

  const line1 = words.slice(0, bestSplit).join(' ');
  const line2 = words.slice(bestSplit).join(' ');
  return `${line1}<br>${line2}`;
}

// 질문, 타이틀 등 텍스트 균형 분할
function formatBreaks(text) {
  if (!text) return '';
  if (text.includes('<br>') || text.includes('\n')) return text;
  return splitBalancedLines(text, 22);
}

// 선택지 텍스트 균형 분할 (16글자 초과 시 위아래 비율 5:5에 가깝게 분할, 단어/음절 분절 방지)
function formatOptionBreaks(text) {
  if (!text) return '';
  if (text.includes('<br>')) return text;
  return splitBalancedLines(text, 16);
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
  document.body.classList.remove('is-narak-result');
  if (screenResult) screenResult.classList.remove('is-narak-result');
  switchScreen(screenModeSelect);
}

// 브라우저 리사이즈 시 차트 재계산
window.addEventListener('resize', () => {
  if (screenResult.classList.contains('active') && lifeTrendCanvas) {
    renderLifeTrendChart();
  }
});

// ==========================================
// 14. Web Audio API 기반 무설치 효과음(SFX) 시스템
// ==========================================
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// 효과음 재생 함수 (type: 'pop' | 'select' | 'action')
function playSfx(type = 'pop') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === 'select') {
      // A/B 선택지 클릭 시: 쫀득하고 탄력 있는 듀얼 탭 사운드
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.08);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'action') {
      // 주요 액션 버튼(시작하기, 이미지 저장 등): 밝고 산뜻한 상승 톤
      osc.type = 'sine';
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.12);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } else {
      // 일반 버튼 클릭 시: 가볍고 경쾌한 미니 팝(Pop) 사운드
      osc.type = 'sine';
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.06);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    }
  } catch (err) {
    // 오디오 정책 등으로 인한 에러 무시
  }
}

// 코인 효과음 (대문 페이지 버튼 전용 coin-sfx.mp3)
const coinAudio = new Audio('coin-sfx.mp3');
coinAudio.preload = 'auto';

function playCoinSfx() {
  try {
    const sound = coinAudio.cloneNode();
    sound.volume = 0.85;
    sound.play().catch(() => {});
  } catch (e) {}
}

// 모든 버튼 및 클릭 가능한 요소에 이벤트 위임으로 효과음 연결
document.addEventListener('click', (e) => {
  const target = e.target.closest('button, [role="button"], .mode-card, .destiny-gate, .option-btn, a');
  if (!target) return;

  // 1. 대문 페이지(screenModeSelect) 내 모든 버튼/게이트/링크 클릭 시 coin-sfx.mp3 재생
  if (target.closest('#screenModeSelect')) {
    playCoinSfx();
    return;
  }

  // 2. 다른 화면 버튼별 효과음
  if (target.classList.contains('option-btn') || target.closest('.option-btn')) {
    playSfx('select');
  } else if (target.classList.contains('primary-btn') || target.id === 'btnStartGame') {
    playSfx('action');
  } else {
    playSfx('pop');
  }
});
