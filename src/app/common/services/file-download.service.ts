import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';

export interface DownloadableFile {
  readonly blob: Blob;
  readonly filename: string;
}

export interface PreparedFile {
  readonly file: DownloadableFile;
  readonly url: string;
  release(): void;
}

@Injectable({ providedIn: 'root' })
export class FileDownloadService {
  private readonly document = inject(DOCUMENT);

  prepare(file: DownloadableFile): PreparedFile {
    const url = URL.createObjectURL(file.blob);
    let released = false;
    return {
      file,
      url,
      release: () => {
        if (released) return;
        released = true;
        URL.revokeObjectURL(url);
      },
    };
  }

  save(prepared: PreparedFile): void {
    const link = this.document.createElement('a');
    link.href = prepared.url;
    link.download = prepared.file.filename;
    link.rel = 'noopener';
    link.style.display = 'none';
    this.document.body.appendChild(link);
    link.click();
    link.remove();
  }

  canShare(file: DownloadableFile): boolean {
    const nav = this.document.defaultView?.navigator;
    if (!nav || typeof nav.share !== 'function' || typeof nav.canShare !== 'function') return false;
    try {
      return nav.canShare({ files: [this.toFile(file)] });
    } catch {
      return false;
    }
  }

  async share(file: DownloadableFile): Promise<boolean> {
    const nav = this.document.defaultView?.navigator;
    if (!nav || typeof nav.share !== 'function') return false;
    try {
      await nav.share({ files: [this.toFile(file)], title: file.filename });
      return true;
    } catch {
      return false;
    }
  }

  private toFile(file: DownloadableFile): File {
    return new File([file.blob], file.filename, { type: file.blob.type });
  }
}
