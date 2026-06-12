import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../../environments/environment';

@Pipe({
  name: 'versionedImageUrl',
  standalone: true,
  pure: true,
})
export class VersionedImageUrlPipe implements PipeTransform {
  transform(imageUrl: unknown, updatedAt?: string | null): string | null {
    if (Array.isArray(imageUrl)) {
      imageUrl = imageUrl[0]?.url;
    }

    if (!imageUrl) {
      return null;
    }

    if (typeof imageUrl !== 'string') {
      return null;
    }

    if (!updatedAt || !this._isInternalImageUrl(imageUrl)) {
      return imageUrl;
    }

    const separator = imageUrl.includes('?') ? '&' : '?';
    return `${imageUrl}${separator}v=${encodeURIComponent(updatedAt)}`;
  }

  private _isInternalImageUrl(imageUrl: string): boolean {
    if (imageUrl.startsWith('/user/upload/') || imageUrl.startsWith('/uploads/images/')) {
      return true;
    }

    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
      return false;
    }

    return (
      imageUrl.startsWith(`${environment.apiUrl}/user/upload/`) ||
      imageUrl.startsWith(`${environment.apiUrl}/uploads/images/`)
    );
  }
}
