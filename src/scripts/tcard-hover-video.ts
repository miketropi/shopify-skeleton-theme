/** Collection/search product cards: play muted loop video on pointer hover (see `data-tcard-hover-video`). */

function setTcardVideoPlayingUi(card: HTMLElement | null, playing: boolean): void {
  card?.classList.toggle('tcard--video-hover-playing', playing)
}

export function bindTcardHoverVideos(root: ParentNode, signal?: AbortSignal): void {
  if (typeof document === 'undefined') return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  root.querySelectorAll<HTMLElement>('[data-tcard-hover-video]').forEach((wrap) => {
    if (wrap.dataset.tcardHoverVideoBound === '1') return
    const video = wrap.querySelector<HTMLVideoElement>('video')
    if (!video) return
    wrap.dataset.tcardHoverVideoBound = '1'

    const card = wrap.closest('.tcard')

    const syncFromVideo = (): void => {
      setTcardVideoPlayingUi(card, !video.paused)
    }

    video.addEventListener('play', syncFromVideo, { signal })
    video.addEventListener('pause', syncFromVideo, { signal })
    syncFromVideo()

    const onEnter = (): void => {
      void video.play().catch(() => {
        setTcardVideoPlayingUi(card, false)
      })
    }
    const onLeave = (): void => {
      video.pause()
      try {
        video.currentTime = 0
      } catch {
        /* ignore */
      }
    }
    wrap.addEventListener('pointerenter', onEnter, { signal })
    wrap.addEventListener('pointerleave', onLeave, { signal })
  })
}
