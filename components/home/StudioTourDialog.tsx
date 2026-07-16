"use client";

import { useRef } from "react";

export function StudioTourDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  function openTour() {
    const dialog = dialogRef.current;
    if (!dialog) return;

    dialog.showModal();
    void videoRef.current?.play().catch(() => {
      // Native controls remain available when autoplay is blocked.
    });
  }

  function closeTour() {
    videoRef.current?.pause();
    dialogRef.current?.close();
  }

  function resetTour() {
    const video = videoRef.current;
    if (!video) return;

    video.pause();
    video.currentTime = 0;
  }

  return (
    <>
      <button
        type="button"
        className="arrow-link arrow-link--outline-light"
        onClick={openTour}
      >
        <span>Watch tour video</span>
        <span aria-hidden="true" className="arrow-link__arrow">
          {"\u2192"}
        </span>
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="studio-tour-dialog-title"
        className="studio-tour-dialog"
        onCancel={() => videoRef.current?.pause()}
        onClose={resetTour}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeTour();
        }}
        onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          closeTour();
        }}
      >
        <div className="studio-tour-dialog__panel">
          <div className="studio-tour-dialog__header">
            <h2 id="studio-tour-dialog-title">Studio GQ tour</h2>
            <button
              type="button"
              aria-label="Close tour video"
              autoFocus
              className="studio-tour-dialog__close"
              onClick={closeTour}
            >
              <span aria-hidden="true">{"\u00d7"}</span>
            </button>
          </div>

          <video
            ref={videoRef}
            className="studio-tour-dialog__video"
            controls
            playsInline
            preload="none"
            poster="/images/gallery/studio-gq-tour-poster.jpg"
          >
            <source src="/videos/studio-gq-tour.mp4" type="video/mp4" />
            Your browser does not support embedded video.
          </video>
        </div>
      </dialog>
    </>
  );
}
