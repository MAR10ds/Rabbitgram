// RabbitGram: "Message Shot" — renders a message as a clean shareable PNG
// card (author, text, time, RabbitGram footer) and triggers a download.
// Drawn by hand on a canvas instead of screenshotting the live DOM: no
// html2canvas dependency, no cross-origin taint issues, and the output is
// identical regardless of the viewer's window size. Colors are read from the
// live CSS variables so the card matches the current (light/dark) theme.

const WIDTH = 520;
const SCALE = 2;
const PADDING = 24;
const BUBBLE_PADDING = 16;
const LINE_HEIGHT = 22;
const MAX_LINES = 60;
const FONT_FAMILY = '"Roboto", -apple-system, "Helvetica Neue", sans-serif';

function cssVar(styles: CSSStyleDeclaration, name: string, fallback: string) {
  return styles.getPropertyValue(name).trim() || fallback;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for(const paragraph of text.split('\n')) {
    if(!paragraph) {
      lines.push('');
      continue;
    }

    let line = '';
    for(const word of paragraph.split(' ')) {
      const attempt = line ? line + ' ' + word : word;
      if(ctx.measureText(attempt).width <= maxWidth || !line) {
        line = attempt;
      } else {
        lines.push(line);
        line = word;
      }
    }

    lines.push(line);

    if(lines.length > MAX_LINES) {
      break;
    }
  }

  if(lines.length > MAX_LINES) {
    lines.length = MAX_LINES;
    lines.push('…');
  }

  return lines;
}

export function downloadMessageShot({title, text, date}: {
  title: string,
  text: string,
  date: number
}) {
  const styles = getComputedStyle(document.documentElement);
  const backgroundColor = cssVar(styles, '--background-color-true', cssVar(styles, '--background-color', '#e6ebee'));
  const surfaceColor = cssVar(styles, '--surface-color', '#ffffff');
  const textColor = cssVar(styles, '--primary-text-color', '#000000');
  const secondaryColor = cssVar(styles, '--secondary-text-color', '#707579');
  const primaryColor = cssVar(styles, '--primary-color', '#3390ec');

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Measure the wrap before sizing the canvas (resizing resets ctx state,
  // so the font is set again after the resize below).
  const textMaxWidth = WIDTH - PADDING * 2 - BUBBLE_PADDING * 2;
  ctx.font = `16px ${FONT_FAMILY}`;
  const wrapped = wrapLines(ctx, text, textMaxWidth);

  const bubbleHeight = BUBBLE_PADDING + 24/* author */ + wrapped.length * LINE_HEIGHT + 20/* time */ + BUBBLE_PADDING;
  const footerHeight = 36;
  const height = PADDING + bubbleHeight + footerHeight + PADDING / 2;

  canvas.width = WIDTH * SCALE;
  canvas.height = height * SCALE;
  ctx.scale(SCALE, SCALE);

  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, WIDTH, height);

  ctx.fillStyle = surfaceColor;
  roundRect(ctx, PADDING, PADDING, WIDTH - PADDING * 2, bubbleHeight, 12);
  ctx.fill();

  let y = PADDING + BUBBLE_PADDING + 16;
  const x = PADDING + BUBBLE_PADDING;

  ctx.fillStyle = primaryColor;
  ctx.font = `bold 15px ${FONT_FAMILY}`;
  ctx.fillText(title, x, y, textMaxWidth);
  y += 24;

  ctx.fillStyle = textColor;
  ctx.font = `16px ${FONT_FAMILY}`;
  for(const line of wrapped) {
    ctx.fillText(line, x, y);
    y += LINE_HEIGHT;
  }

  const timeText = new Date(date * 1000).toLocaleString();
  ctx.fillStyle = secondaryColor;
  ctx.font = `12px ${FONT_FAMILY}`;
  ctx.textAlign = 'right';
  ctx.fillText(timeText, WIDTH - PADDING - BUBBLE_PADDING, PADDING + bubbleHeight - BUBBLE_PADDING);

  ctx.textAlign = 'center';
  ctx.font = `13px ${FONT_FAMILY}`;
  ctx.fillText('🐰 RabbitGram', WIDTH / 2, PADDING + bubbleHeight + 24);

  canvas.toBlob((blob) => {
    if(!blob) {
      return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rabbitgram-message-${date}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10e3);
  }, 'image/png');
}
