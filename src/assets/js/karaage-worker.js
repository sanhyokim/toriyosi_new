// からあげの高さマップ計算を別スレッドで行う。結果は ImageBitmap で返す。
import { bakePiece } from './karaage.js';

self.onmessage = (e) => {
  const { id, opts } = e.data;
  const r = bakePiece(opts);
  const bmp = r.canvas.transferToImageBitmap();
  self.postMessage({ id, bmp, glints: r.glints, w: r.w, h: r.h }, [bmp]);
};
