(() => {
  'use strict';

  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 상단바 상태
  const topbar = $('#topbar');
  addEventListener('scroll', () => {
    topbar?.classList.toggle('stuck', scrollY > 30);
  }, { passive: true });

  // 모바일 메뉴
  const menu = $('#menu');
  const nav = $('.topnav');

  menu?.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    menu.classList.toggle('open', isOpen);
    menu.setAttribute('aria-expanded', String(isOpen));
    document.body.classList.toggle('lock', isOpen);
  });

  const photosGroup = $('.topnav__photos');
  const photosTrigger = $('.topnav__photos-trigger');
  photosTrigger?.addEventListener('click', () => {
    const expanded = photosGroup.classList.toggle('is-open');
    photosTrigger.setAttribute('aria-expanded', String(expanded));
  });
  $$('.topnav a:not(.topnav__photos-trigger)').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      menu?.classList.remove('open');
      photosGroup?.classList.remove('is-open');
      photosTrigger?.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('lock');
    });
  });

  // Contact는 기본 앵커 스크롤을 사용해 현재 문서 레이아웃에 맞춰 이동합니다.
  // 섹션 등장 효과
  const reveal = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('seen');
        reveal.unobserve(entry.target);
      }
    });
  }, { threshold: 0.18 });

  $$('.film-strip__body, .about-new__grid, .contact-new__inner').forEach(element => {
    reveal.observe(element);
  });

  // 스크롤에 따른 스토리 이미지·텍스트 전환
  const storySection = $('.story-sequence');
  const storyWords = $$('.story-word');
  const storyImages = $$('.story-image');
  let storyIndex = 0;
  let storyFrame = 0;

  function setStory(index) {
    storyWords.forEach((word, current) => {
      word.classList.toggle('is-active', current === index);
    });
    storyImages.forEach((image, current) => {
      image.classList.toggle('is-active', current === index);
    });
  }

  function updateStory() {
    if (!storySection || !storyWords.length) return;

    const distance = Math.max(0, scrollY - storySection.offsetTop);
    const nextIndex = Math.max(
      0,
      Math.min(storyWords.length - 1, Math.floor(distance / innerHeight))
    );

    if (nextIndex !== storyIndex) {
      storyIndex = nextIndex;
      setStory(nextIndex);
    }
    storyFrame = 0;
  }

  setStory(0);
  addEventListener('scroll', () => {
    if (!storyFrame) storyFrame = requestAnimationFrame(updateStory);
  }, { passive: true });

  // 작업 이미지 전환
  const workSteps = $$('[data-work-step]');
  const workImage = $('#workImage');
  const workTitle = $('#workTitle');
  const workDots = $$('.work-reveal__dots button');

  function setWork(index) {
    const step = workSteps[index];
    if (!step) return;

    if (workImage) {
      workImage.style.opacity = '0';
      workImage.style.transform = 'scale(1.04)';
      setTimeout(() => {
        workImage.src = step.dataset.image;
        workImage.style.opacity = '1';
        workImage.style.transform = 'scale(1)';
      }, reduceMotion ? 0 : 180);
    }

    if (workTitle) workTitle.innerHTML = step.dataset.title;
    workDots.forEach((dot, current) => dot.classList.toggle('is-active', current === index));
  }

  const workObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) setWork(Number(entry.target.dataset.workStep));
    });
  }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });

  workSteps.forEach(step => workObserver.observe(step));
  workDots.forEach(dot => {
    dot.addEventListener('click', () => {
      workSteps[Number(dot.dataset.work)]?.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth'
      });
    });
  });

  // 사진 카테고리별 추가 이미지 표시
  $$('.selected-gallery').forEach(gallery => {
    const moreButton = $('.gallery-more', gallery);
    moreButton?.addEventListener('click', () => {
      const expanded = gallery.classList.toggle('is-expanded');
      moreButton.setAttribute('aria-expanded', String(expanded));
      moreButton.setAttribute('aria-label', expanded ? '사진 접기' : '사진 더 보기');
      moreButton.querySelector('span').textContent = expanded ? '−' : '+';
      moreButton.firstChild.textContent = expanded ? '사진 접기 ' : '사진 더 보기 ';
    });
  });

  const videoGallery = $('.selected-video-gallery');
  const videoGalleryMore = $('.video-gallery-more');
  videoGalleryMore?.addEventListener('click', () => {
    const expanded = videoGallery.classList.toggle('is-expanded');
    videoGalleryMore.setAttribute('aria-expanded', String(expanded));
    videoGalleryMore.querySelector('span').textContent = expanded ? '−' : '+';
    videoGalleryMore.firstChild.textContent = expanded ? '영상 접기 ' : '영상 더 보기 ';
  });

  // 하단 사용 폰트 목록 열기·닫기
  const fontDrawer = $('.font-drawer');
  const fontDrawerToggle = $('.font-drawer__toggle');
  const fontDrawerPanel = $('#fontDrawerPanel');
  fontDrawerToggle?.addEventListener('click', () => {
    const expanded = fontDrawerToggle.getAttribute('aria-expanded') !== 'true';
    fontDrawerToggle.setAttribute('aria-expanded', String(expanded));
    fontDrawer?.classList.toggle('is-open', expanded);
    if (fontDrawerPanel) fontDrawerPanel.hidden = !expanded;
  });

  // YouTube 영상 모달 및 카드 썸네일
  const videoModal = $('#videoModal');
  const videoPlayer = $('#videoPlayer');
  const videoTitle = $('#videoTitle');

  function getYouTubeId(source) {
    if (!source || source.includes('여기에')) return '';
    try {
      const url = new URL(source.trim());
      if (url.hostname === 'youtu.be') return url.pathname.slice(1).split('/')[0];
      if (url.hostname.endsWith('youtube.com')) {
        if (url.pathname === '/watch') return url.searchParams.get('v') || '';
        const parts = url.pathname.split('/').filter(Boolean);
        if (['embed', 'shorts', 'live'].includes(parts[0])) return parts[1] || '';
      }
    } catch (_) {}
    return '';
  }

  function openVideo(source, title) {
    const videoId = getYouTubeId(source);
    if (!videoId || !videoPlayer || !videoModal) {
      alert('YouTube 영상 링크를 data-video="여기에 링크 넣기" 부분에 넣어주세요.');
      return;
    }
    videoPlayer.src = `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0`;
    videoTitle.textContent = title || '';
    videoModal.hidden = false;
    document.body.classList.add('lock');
  }

  function closeVideo() {
    if (!videoPlayer || !videoModal) return;
    videoPlayer.removeAttribute('src');
    videoModal.hidden = true;
    document.body.classList.remove('lock');
  }

  $$('.video-card').forEach(card => {
    const trigger = $('button', card);
    const thumbnail = $('img', card);
    const label = $('span', card);
    const videoId = getYouTubeId(trigger?.dataset.video);
    if (videoId && thumbnail) {
      thumbnail.src = `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`;
      thumbnail.alt = trigger.dataset.title || 'YouTube video thumbnail';
      if (label) label.textContent = '▶ PLAY';
    }
    trigger?.addEventListener('click', () => {
      openVideo(trigger.dataset.video, trigger.dataset.title);
    });
  });

  $('#videoClose')?.addEventListener('click', closeVideo);
  videoModal?.addEventListener('click', event => {
    if (event.target === videoModal) closeVideo();
  });
  addEventListener('keydown', event => {
    if (event.key === 'Escape' && videoModal && !videoModal.hidden) closeVideo();
  });
})();
