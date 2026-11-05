from __future__ import annotations

import html
import hashlib
import re
from pathlib import Path

from PIL import Image as PILImage
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate, Frame, Image, KeepTogether, ListFlowable, ListItem,
    PageBreak, PageTemplate, Paragraph, Spacer, Table, TableStyle,
)
from reportlab.platypus.tableofcontents import TableOfContents
from svglib.svglib import svg2rlg

ROOT = Path(__file__).resolve().parents[2]
SOURCE = Path(__file__).with_name("BugBoard26.md")
OUTPUT = ROOT / "docs" / "BugBoard26.pdf"
PAGE_WIDTH, PAGE_HEIGHT = A4

INK = colors.HexColor("#191B24")
MUTED = colors.HexColor("#5F606D")
PRIMARY = colors.HexColor("#465DFF")
PRIMARY_DARK = colors.HexColor("#10287F")
PRIMARY_CONTAINER = colors.HexColor("#E1E5FF")
SURFACE = colors.HexColor("#F9F7FF")
SURFACE_HIGH = colors.HexColor("#EFEDF5")
OUTLINE = colors.HexColor("#C7C5D0")
SUCCESS = colors.HexColor("#D3F4DF")


def normalized(value: str) -> str:
    return value.replace("—", "-").replace("–", "-").replace("‑", "-")


def rich_text(value: str) -> str:
    value = html.escape(normalized(value.strip()))
    value = re.sub(r"`([^`]+)`", r'<font name="Courier">\1</font>', value)
    value = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", value)
    value = re.sub(r"\[([^]]+)\]\(([^)]+)\)", r'<link href="\2" color="#465DFF">\1</link>', value)
    return value


styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="CoverTitle", fontName="Helvetica-Bold", fontSize=38, leading=40, textColor=colors.white, spaceAfter=10))
styles.add(ParagraphStyle(name="CoverSubtitle", fontName="Helvetica", fontSize=17, leading=23, textColor=colors.HexColor("#DCE2FF"), spaceAfter=22))
styles.add(ParagraphStyle(name="CoverMeta", fontName="Helvetica", fontSize=10, leading=16, textColor=colors.HexColor("#BCC7FF")))
styles.add(ParagraphStyle(name="H1", fontName="Helvetica-Bold", fontSize=23, leading=27, textColor=PRIMARY_DARK, spaceBefore=8, spaceAfter=12, keepWithNext=True))
styles.add(ParagraphStyle(name="H2", fontName="Helvetica-Bold", fontSize=15, leading=19, textColor=INK, spaceBefore=12, spaceAfter=7, keepWithNext=True))
styles.add(ParagraphStyle(name="H3", fontName="Helvetica-Bold", fontSize=11.5, leading=15, textColor=PRIMARY_DARK, spaceBefore=8, spaceAfter=5, keepWithNext=True))
styles.add(ParagraphStyle(name="BodyTextBB", fontName="Helvetica", fontSize=9.3, leading=14, textColor=INK, alignment=TA_LEFT, spaceAfter=7))
styles.add(ParagraphStyle(name="Small", fontName="Helvetica", fontSize=7.6, leading=10, textColor=MUTED))
styles.add(ParagraphStyle(name="Caption", fontName="Helvetica-Oblique", fontSize=7.6, leading=10, textColor=MUTED, alignment=TA_CENTER, spaceBefore=4, spaceAfter=10))
styles.add(ParagraphStyle(name="Callout", fontName="Helvetica", fontSize=9, leading=14, textColor=PRIMARY_DARK, backColor=PRIMARY_CONTAINER, borderColor=PRIMARY, borderWidth=0.7, borderPadding=10, borderRadius=8, spaceAfter=12))
styles.add(ParagraphStyle(name="TableHead", fontName="Helvetica-Bold", fontSize=7.2, leading=9, textColor=colors.white))
styles.add(ParagraphStyle(name="TableCell", fontName="Helvetica", fontSize=7, leading=9, textColor=INK))
styles.add(ParagraphStyle(name="TOCHeading", fontName="Helvetica-Bold", fontSize=25, leading=29, textColor=PRIMARY_DARK, spaceAfter=16))


class TechnicalDocTemplate(BaseDocTemplate):
    def __init__(self, filename: str):
        super().__init__(filename, pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm,
                         topMargin=20 * mm, bottomMargin=18 * mm, title="BugBoard26 - Documento tecnico finale",
                         author="Giovanni Barone; Massimo Apicella", subject="BugBoard26")
        frame = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id="normal")
        self.addPageTemplates(PageTemplate(id="all", frames=frame, onPage=draw_page))

    def afterFlowable(self, flowable):
        if not isinstance(flowable, Paragraph) or flowable.style.name not in {"H1", "H2"}:
            return
        level = 0 if flowable.style.name == "H1" else 1
        text = flowable.getPlainText()
        key = "heading-" + hashlib.sha1(text.encode("utf-8")).hexdigest()[:12]
        self.canv.bookmarkPage(key)
        if level == 0:
            self.canv.addOutlineEntry(text, key, level=0, closed=False)
        self.notify("TOCEntry", (level, text, self.page, key))


def draw_page(canvas, doc):
    canvas.saveState()
    if doc.page == 1:
        canvas.setFillColor(PRIMARY_DARK)
        canvas.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)
        canvas.setFillColor(colors.HexColor("#273FBA"))
        canvas.circle(PAGE_WIDTH - 28 * mm, PAGE_HEIGHT - 18 * mm, 58 * mm, fill=1, stroke=0)
        canvas.setFillColor(colors.HexColor("#465DFF"))
        canvas.circle(PAGE_WIDTH - 3 * mm, 25 * mm, 42 * mm, fill=1, stroke=0)
    else:
        canvas.setStrokeColor(OUTLINE)
        canvas.setLineWidth(0.4)
        canvas.line(18 * mm, PAGE_HEIGHT - 13 * mm, PAGE_WIDTH - 18 * mm, PAGE_HEIGHT - 13 * mm)
        canvas.setFont("Helvetica-Bold", 7.5)
        canvas.setFillColor(PRIMARY_DARK)
        canvas.drawString(18 * mm, PAGE_HEIGHT - 10 * mm, "BUGBOARD26")
        canvas.setFont("Helvetica", 7.5)
        canvas.setFillColor(MUTED)
        canvas.drawRightString(PAGE_WIDTH - 18 * mm, PAGE_HEIGHT - 10 * mm, "Documento tecnico finale")
        canvas.drawCentredString(PAGE_WIDTH / 2, 9 * mm, str(doc.page - 1))
    canvas.restoreState()


def figure(path: Path, caption: str):
    max_width = 170 * mm
    max_height = 112 * mm
    if path.suffix.lower() == ".svg":
        drawing = svg2rlg(str(path))
        scale = min(max_width / drawing.width, max_height / drawing.height, 1.0)
        drawing.width *= scale
        drawing.height *= scale
        drawing.scale(scale, scale)
        return KeepTogether([drawing, Paragraph(rich_text(caption), styles["Caption"])])
    with PILImage.open(path) as image:
        width, height = image.size
    scale = min(max_width / width, max_height / height, 1.0)
    item = Image(str(path), width=width * scale, height=height * scale)
    item.hAlign = "CENTER"
    return KeepTogether([item, Paragraph(rich_text(caption), styles["Caption"])])


def table_from(lines: list[str]):
    rows = [[cell.strip() for cell in line.strip().strip("|").split("|")] for line in lines]
    if len(rows) > 1 and all(re.fullmatch(r":?-{3,}:?", cell.replace(" ", "")) for cell in rows[1]):
        rows.pop(1)
    columns = max(len(row) for row in rows)
    available = 174 * mm
    widths = [available / columns] * columns
    content = []
    for row_index, row in enumerate(rows):
        style = styles["TableHead"] if row_index == 0 else styles["TableCell"]
        content.append([Paragraph(rich_text(cell), style) for cell in row] + [""] * (columns - len(row)))
    table = Table(content, colWidths=widths, repeatRows=1, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PRIMARY_DARK),
        ("BACKGROUND", (0, 1), (-1, -1), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.35, OUTLINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, SURFACE]),
    ]))
    return table


def parse_markdown(text: str):
    lines = text.splitlines()
    start = next(index for index, line in enumerate(lines) if line.startswith("# 1."))
    lines = lines[start:]
    story = []
    index = 0
    first_section = True
    sequence_figure_seen = False
    while index < len(lines):
        line = lines[index].rstrip()
        if not line:
            index += 1
            continue
        image_match = re.fullmatch(r"!\[([^]]+)]\(([^)]+)\)", line.strip())
        if image_match:
            if image_match.group(1).startswith("Sequence") and sequence_figure_seen:
                story.append(PageBreak())
            if image_match.group(1).startswith("Sequence"):
                sequence_figure_seen = True
            relative = (SOURCE.parent / image_match.group(2)).resolve()
            story.append(figure(relative, image_match.group(1)))
            index += 1
            continue
        if line.startswith("# "):
            if not first_section:
                story.append(PageBreak())
            first_section = False
            story.append(Paragraph(rich_text(line[2:]), styles["H1"]))
            index += 1
            continue
        if line.startswith("## "):
            story.append(Paragraph(rich_text(line[3:]), styles["H2"]))
            index += 1
            continue
        if line.startswith("### "):
            story.append(Paragraph(rich_text(line[4:]), styles["H3"]))
            index += 1
            continue
        if line.startswith("> "):
            quoted = []
            while index < len(lines) and lines[index].startswith("> "):
                quoted.append(lines[index][2:])
                index += 1
            story.append(Paragraph(rich_text(" ".join(quoted)), styles["Callout"]))
            continue
        if line.startswith("| "):
            table_lines = []
            while index < len(lines) and lines[index].lstrip().startswith("|"):
                table_lines.append(lines[index])
                index += 1
            story.extend([table_from(table_lines), Spacer(1, 7)])
            continue
        if line.startswith("- "):
            bullets = []
            while index < len(lines) and lines[index].startswith("- "):
                bullets.append(ListItem(Paragraph(rich_text(lines[index][2:]), styles["BodyTextBB"]), leftIndent=12))
                index += 1
            story.append(ListFlowable(bullets, bulletType="bullet", start="circle", leftIndent=18, bulletColor=PRIMARY))
            story.append(Spacer(1, 4))
            continue
        paragraph = [line]
        index += 1
        while index < len(lines) and lines[index].strip() and not re.match(r"^(#|##|###|> |\| |- |!\[)", lines[index]):
            paragraph.append(lines[index].strip())
            index += 1
        story.append(Paragraph(rich_text(" ".join(paragraph)), styles["BodyTextBB"]))
    return story


def build():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    document = TechnicalDocTemplate(str(OUTPUT))
    toc = TableOfContents()
    toc.levelStyles = [
        ParagraphStyle(name="TOC1", fontName="Helvetica-Bold", fontSize=10, leading=16, leftIndent=0, firstLineIndent=0, textColor=PRIMARY_DARK, spaceBefore=4),
        ParagraphStyle(name="TOC2", fontName="Helvetica", fontSize=8.5, leading=13, leftIndent=14, firstLineIndent=0, textColor=MUTED),
    ]
    story = [
        Spacer(1, 56 * mm),
        Paragraph("BUGBOARD26", styles["CoverTitle"]),
        Paragraph("Piattaforma collaborativa per la gestione delle issue", styles["CoverSubtitle"]),
        Spacer(1, 65 * mm),
        Paragraph("Documento tecnico finale - Versione 1.2", styles["CoverMeta"]),
        Paragraph("Giovanni Barone · Massimo Apicella", styles["CoverMeta"]),
        Paragraph("Edizione per repository pubblico", styles["CoverMeta"]),
        PageBreak(),
        Paragraph("Indice", styles["TOCHeading"]),
        toc,
        PageBreak(),
    ]
    story.extend(parse_markdown(SOURCE.read_text(encoding="utf-8")))
    document.multiBuild(story)
    print(f"Created {OUTPUT} ({OUTPUT.stat().st_size} bytes)")


if __name__ == "__main__":
    build()
