export interface DialogLine {
  id: string;
  type: 'title' | 'wait' | 'sfx' | 'textcolor' | 'text' | 'newline' | 'extra_text' | 'comment' | 'blank' | 'unknown';
  value: string;      // Primarily arguments like TEXT_KEY, number of lines, delay in ms, etc.
  rawComment?: string; // If there was a comment on the same line, e.g. TEXT KEY # Inline comment
}

export interface DialogChapter {
  id: number;
  lines: DialogLine[];
  comment?: string; // Any comment immediately preceding or above the chapter title
}

/**
 * Parses a Dialog/Story TXT script into a clean structured array of chapters.
 */
export function parseDialog(text: string): DialogChapter[] {
  // Strip UTF-8 BOM or zero-width spaces if present at the absolute start
  let cleanedText = text;
  if (cleanedText.charCodeAt(0) === 0xFEFF) {
    cleanedText = cleanedText.slice(1);
  }
  cleanedText = cleanedText.replace(/^\uFEFF/, '');

  const chapters: DialogChapter[] = [];
  const lines = cleanedText.split(/\r?\n/);
  
  let currentChapter: DialogChapter | null = null;
  let pendingChapterComment: string | undefined = undefined;

  for (let i = 0; i < lines.length; i++) {
    const originalLine = lines[i];
    const trimmed = originalLine.trim();

    // Check for chapter marker, e.g. [CHAPTER 0] or [CHAPTER  5]
    const chapterMatch = trimmed.match(/^\[CHAPTER\s+(\d+)\]/i);
    if (chapterMatch) {
      const chapterId = parseInt(chapterMatch[1], 10);
      currentChapter = {
        id: chapterId,
        lines: [],
        comment: pendingChapterComment
      };
      chapters.push(currentChapter);
      pendingChapterComment = undefined;
      continue;
    }

    // Handle comments preceding chapter or commands
    if (!currentChapter) {
      if (trimmed === '') {
        continue;
      }
      if (trimmed.startsWith('#')) {
        pendingChapterComment = (pendingChapterComment ? pendingChapterComment + '\n' : '') + trimmed;
        continue;
      }
      // If we encounter code block commands/values before any [CHAPTER] marker, auto-create [CHAPTER 0]
      currentChapter = {
        id: 0,
        lines: [],
        comment: pendingChapterComment
      };
      chapters.push(currentChapter);
      pendingChapterComment = undefined;
    }

    // Treat completely blank lines inside chapter
    if (trimmed === '') {
      currentChapter.lines.push({
        id: crypto.randomUUID?.() || Math.random().toString(36).substring(2),
        type: 'blank',
        value: ''
      });
      continue;
    }

    // Split line by comment # to handle inline comments
    let codePart = trimmed;
    let inlineComment: string | undefined = undefined;
    
    // Check if the whole line is a comment or if there is an inline comment
    if (trimmed.startsWith('#')) {
      currentChapter.lines.push({
        id: crypto.randomUUID?.() || Math.random().toString(36).substring(2),
        type: 'comment',
        value: trimmed
      });
      continue;
    }

    const firstHash = trimmed.indexOf('#');
    if (firstHash !== -1) {
      codePart = trimmed.substring(0, firstHash).trim();
      inlineComment = trimmed.substring(firstHash).trim();
    }

    const tokens = codePart.split(/\s+/);
    const cmd = tokens[0].toUpperCase();
    const args = tokens.slice(1).join(' ').trim();

    const lineId = crypto.randomUUID?.() || Math.random().toString(36).substring(2);

    if (cmd === 'TITLE') {
      currentChapter.lines.push({
        id: lineId,
        type: 'title',
        value: args,
        rawComment: inlineComment
      });
    } else if (cmd === 'WAIT') {
      currentChapter.lines.push({
        id: lineId,
        type: 'wait',
        value: args,
        rawComment: inlineComment
      });
    } else if (cmd === 'SFX') {
      currentChapter.lines.push({
        id: lineId,
        type: 'sfx',
        value: args,
        rawComment: inlineComment
      });
    } else if (cmd === 'TEXTCOLOR') {
      currentChapter.lines.push({
        id: lineId,
        type: 'textcolor',
        value: args, // preserves e.g. "000 193 091 255" or "255, 0, 0, 255"
        rawComment: inlineComment
      });
    } else if (cmd === 'TEXT') {
      currentChapter.lines.push({
        id: lineId,
        type: 'text',
        value: args,
        rawComment: inlineComment
      });
    } else if (cmd === 'NEWLINE') {
      currentChapter.lines.push({
        id: lineId,
        type: 'newline',
        value: args,
        rawComment: inlineComment
      });
    } else if (cmd === 'EXTRA_TEXT') {
      currentChapter.lines.push({
        id: lineId,
        type: 'extra_text',
        value: args,
        rawComment: inlineComment
      });
    } else {
      currentChapter.lines.push({
        id: lineId,
        type: 'unknown',
        value: trimmed, // keep entire trimmed line
      });
    }
  }

  return chapters;
}

/**
 * Serializes chapters array back into the standard Empire at War Dialog TXT format.
 */
export function serializeDialog(chapters: DialogChapter[]): string {
  let output = '';

  for (const chapter of chapters) {
    // Add preceding comment if exists
    if (chapter.comment) {
      output += chapter.comment + '\n';
    }

    output += `[CHAPTER ${chapter.id}]\n`;

    for (const line of chapter.lines) {
      if (line.type === 'blank') {
        output += '\n';
        continue;
      }
      if (line.type === 'comment') {
        output += line.value + '\n';
        continue;
      }
      if (line.type === 'unknown') {
        output += line.value + '\n';
        continue;
      }

      // Format code line
      let lineStr = `${line.type.toUpperCase()}`;
      if (line.value) {
        lineStr += ` ${line.value}`;
      }
      if (line.rawComment) {
        lineStr += ` ${line.rawComment}`;
      }

      output += lineStr + '\n';
    }
    output += '\n'; // Double spacing between chapters
  }

  // Clean trailing spaces or double lines
  return output.replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

/**
 * Converts TEXTCOLOR parameter (e.g. "000 193 091 255" or "255, 024, 039, 255")
 * to standard CSS Hex/RGBA format for layout rendering.
 */
export function parseTextColorToCss(colorStr: string): string {
  // Normalize color string by removing commas and extra spacing
  const cleaned = colorStr.replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
  const parts = cleaned.split(' ');
  
  if (parts.length >= 3) {
    const r = parseInt(parts[0], 10) || 0;
    const g = parseInt(parts[1], 10) || 0;
    const b = parseInt(parts[2], 10) || 0;
    const a = parts[3] !== undefined ? (parseInt(parts[3], 10) / 255) : 1;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  return 'rgba(255, 255, 255, 1)'; // Default text color if unparsable
}
