if (!customElements.get('media-gallery')) {
  customElements.define(
    'media-gallery',
    class MediaGallery extends HTMLElement {
      constructor() {
        super();
        this.elements = {
          liveRegion: this.querySelector('[id^="GalleryStatus"]'),
          viewer: this.querySelector('[id^="GalleryViewer"]'),
          thumbnails: this.querySelector('[id^="GalleryThumbnails"]'),
        };
        this.mql = window.matchMedia('(min-width: 750px)');
        if (!this.elements.thumbnails) return;

        // ✅ Sync slide change
        this.elements.viewer.addEventListener(
          'slideChanged',
          debounce(this.onSlideChanged.bind(this), 500)
        );

        // ✅ Thumbnail click
        this.elements.thumbnails.querySelectorAll('[data-target]').forEach((mediaToSwitch) => {
          mediaToSwitch
            .querySelector('button')
            .addEventListener(
              'click',
              this.setActiveMedia.bind(this, mediaToSwitch.dataset.target, false)
            );
        });

        // ✅ Thumbnail scroll arrows
        const prevBtn = this.elements.thumbnails.querySelector('.thumbnail-slider .slider-button--prev');
        const nextBtn = this.elements.thumbnails.querySelector('.thumbnail-slider .slider-button--next');
        const wrapper = this.elements.thumbnails.querySelector('.thumbnail-list');

        if (prevBtn && nextBtn && wrapper) {
          const enableArrows = () => {
            prevBtn.removeAttribute('disabled');
            nextBtn.removeAttribute('disabled');
          };

          prevBtn.addEventListener('click', () => {
            wrapper.scrollBy({ top: -100, behavior: 'smooth' });
            enableArrows();
          });
          nextBtn.addEventListener('click', () => {
            wrapper.scrollBy({ top: 100, behavior: 'smooth' });
            enableArrows();
          });

          enableArrows();
          new MutationObserver(enableArrows).observe(prevBtn, { attributes: true });
          new MutationObserver(enableArrows).observe(nextBtn, { attributes: true });
        }

        // ✅ Main gallery arrows
        this.prevArrow = this.querySelector('.gallery-button--prev');
        this.nextArrow = this.querySelector('.gallery-button--next');
        if (this.prevArrow && this.nextArrow) {
          this.prevArrow.addEventListener('click', () => this.navigateGallery(-1));
          this.nextArrow.addEventListener('click', () => this.navigateGallery(1));
        }

        if (this.dataset.desktopLayout.includes('thumbnail') && this.mql.matches)
          this.removeListSemantic();
      }

      // 🔹 Arrow navigation for main gallery
      navigateGallery(direction) {
        const mediaItems = Array.from(this.elements.viewer.querySelectorAll('.product__media-list .product__media-item[data-media-id]'));
        const activeIndex = mediaItems.findIndex((el) => el.classList.contains('is-active'));

        let newIndex = activeIndex + direction;
        if (newIndex < 0) newIndex = mediaItems.length - 1;
        if (newIndex >= mediaItems.length) newIndex = 0;

        const newMediaId = mediaItems[newIndex].dataset.mediaId;

        // Prevent duplicate firing
        if (this.lastMediaId === newMediaId) return;
        this.lastMediaId = newMediaId;

        this.setActiveMedia(newMediaId, false);
      }

      onSlideChanged(event) {
        const thumbnail = this.elements.thumbnails.querySelector(
          `[data-target="${event.detail.currentElement.dataset.mediaId}"]`
        );
        this.setActiveThumbnail(thumbnail);
      }

      setActiveMedia(mediaId, prepend) {
        const mediaItems = Array.from(this.elements.viewer.querySelectorAll('[data-media-id]'));
        const activeMedia =
          this.elements.viewer.querySelector(`[data-media-id="${mediaId}"]`) ||
          this.elements.viewer.querySelector('[data-media-id]');
        if (!activeMedia) return;

        mediaItems.forEach((element) => element.classList.remove('is-active'));
        activeMedia.classList.add('is-active');

        if (prepend) {
          activeMedia.parentElement.firstChild !== activeMedia &&
            activeMedia.parentElement.prepend(activeMedia);

          if (this.elements.thumbnails) {
            const activeThumbnail = this.elements.thumbnails.querySelector(
              `[data-target="${mediaId}"]`
            );
            activeThumbnail.parentElement.firstChild !== activeThumbnail &&
              activeThumbnail.parentElement.prepend(activeThumbnail);
          }

          if (this.elements.viewer.slider) this.elements.viewer.resetPages();
        }

        this.preventStickyHeader();
        window.setTimeout(() => {
          const activeMediaRect = activeMedia.getBoundingClientRect();
          if (activeMediaRect.top > -0.5) return;
          const top = activeMediaRect.top + window.scrollY;
          window.scrollTo({ top: top, behavior: 'smooth' });
        });
        this.playActiveMedia(activeMedia);

        if (!this.elements.thumbnails) return;
        const activeThumbnail = this.elements.thumbnails.querySelector(
          `[data-target="${mediaId}"]`
        );
        this.setActiveThumbnail(activeThumbnail);
      }

      setActiveThumbnail(thumbnail) {
        if (!this.elements.thumbnails || !thumbnail) return;

        this.elements.thumbnails
          .querySelectorAll('button')
          .forEach((element) => element.removeAttribute('aria-current'));
        thumbnail.querySelector('button').setAttribute('aria-current', true);
      }

      playActiveMedia(activeItem) {
        window.pauseAllMedia();
        const deferredMedia = activeItem.querySelector('.deferred-media');
        if (deferredMedia) deferredMedia.loadContent(false);
      }

      preventStickyHeader() {
        this.stickyHeader = this.stickyHeader || document.querySelector('sticky-header');
        if (!this.stickyHeader) return;
        this.stickyHeader.dispatchEvent(new Event('preventHeaderReveal'));
      }

      removeListSemantic() {
        if (!this.elements.viewer.slider) return;
        this.elements.viewer.slider.setAttribute('role', 'presentation');
        this.elements.viewer.sliderItems.forEach((slide) =>
          slide.setAttribute('role', 'presentation')
        );
      }
    }
  );
}
