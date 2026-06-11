import { VersionedImageUrlPipe } from './versioned-image-url.pipe';
import { environment } from '../../../environments/environment';

describe('VersionedImageUrlPipe', () => {
  const pipe = new VersionedImageUrlPipe();

  it('adds a version query param to internal upload images', () => {
    const updatedAt = '2026-06-11T10:00:00';
    const url = `${environment.apiUrl}/user/upload/avatar.jpg`;

    expect(pipe.transform(url, updatedAt)).toBe(
      `${url}?v=${encodeURIComponent(updatedAt)}`
    );
  });

  it('does not add a version query param to external images', () => {
    const url = 'https://lh3.googleusercontent.com/avatar.jpg';

    expect(pipe.transform(url, '2026-06-11T10:00:00')).toBe(url);
  });

  it('keeps old internal images unchanged when no version is provided', () => {
    const url = `${environment.apiUrl}/uploads/images/old-avatar.png`;

    expect(pipe.transform(url, null)).toBe(url);
  });
});
