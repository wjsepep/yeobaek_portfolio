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

  $$('.topnav a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      menu?.classList.remove('open');
      document.body.classList.remove('lock');
    });
  });

  // Contact 이동은 기본 scroll-behavior보다 느린 1.25초 애니메이션을 사용합니다.
  const contactLink = $('.topnav__contact[href="#contact"]');
  contactLink?.addEventListener('click', event => {
    const target = $('#contact');
    if (!target) return;

    event.preventDefault();
    if (reduceMotion) {
      target.scrollIntoView();
      return;
    }

    const start = scrollY;
    const distance = target.offsetTop - start;
    const duration = 1250;
    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    let startTime;

    const animateScroll = timestamp => {
      startTime ??= timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = progress < .5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      scrollTo({ top: start + distance * eased, behavior: 'auto' });
      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      } else {
        root.style.scrollBehavior = previousScrollBehavior;
      }
    };

    requestAnimationFrame(animateScroll);
  });

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

  // 사진 갤러리의 추가 이미지 표시
  const gallery = $('.selected-gallery');
  const galleryMore = $('.gallery-more');
  galleryMore?.addEventListener('click', () => {
    const expanded = gallery.classList.toggle('is-expanded');
    galleryMore.setAttribute('aria-expanded', String(expanded));
    galleryMore.querySelector('span').textContent = expanded ? '−' : '+';
    galleryMore.firstChild.textContent = expanded ? '사진 접기 ' : '사진 더 보기 ';
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

  // 영상 모달
  const videoModal = $('#videoModal');
  const videoPlayer = $('#videoPlayer');
  const videoTitle = $('#videoTitle');

  function openVideo(source, title) {
    videoPlayer.src = source;
    videoTitle.textContent = title;
    videoModal.hidden = false;
    document.body.classList.add('lock');
    videoPlayer.play().catch(() => {});
  }

  function closeVideo() {
    videoPlayer.pause();
    videoPlayer.removeAttribute('src');
    videoPlayer.load();
    videoModal.hidden = true;
    document.body.classList.remove('lock');
  }

  $$('[data-video]').forEach(trigger => {
    trigger.addEventListener('click', () => {
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
