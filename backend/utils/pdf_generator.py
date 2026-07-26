import io
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_records_pdf(records, filters_desc):
    """
    Generates a PDF containing KSP Crime Records table.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#FF7A00'),
        spaceAfter=12
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#52525b'),
        spaceAfter=15
    )

    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#27272a')
    )

    header_style = ParagraphStyle(
        'DocHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=colors.white
    )

    story = []
    
    # Title
    story.append(Paragraph("KARNATAKA STATE POLICE — CRIME DATABASE EXPORT", title_style))
    story.append(Paragraph(f"CONFIDENTIAL // OFFICIAL USE ONLY // ACTIVE FILTERS: {filters_desc}", subtitle_style))
    story.append(Spacer(1, 10))
    
    # Table headers
    data = [
        [
            Paragraph("FIR ID", header_style),
            Paragraph("Date", header_style),
            Paragraph("Crime Type", header_style),
            Paragraph("District", header_style),
            Paragraph("Suspect", header_style),
            Paragraph("Status", header_style)
        ]
    ]
    
    # Table rows
    for r in records:
        data.append([
            Paragraph(str(r.get("fir_id", "")), body_style),
            Paragraph(str(r.get("occurrence_date", "")), body_style),
            Paragraph(str(r.get("crime_type", "")), body_style),
            Paragraph(str(r.get("district", "")), body_style),
            Paragraph(str(r.get("suspect_name", "")), body_style),
            Paragraph(str(r.get("case_status", "")), body_style)
        ])
        
    t = Table(data, colWidths=[80, 70, 90, 100, 110, 90])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#18181b')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e4e4e7')),
        ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#fafafa')),
    ]))
    
    story.append(t)
    doc.build(story)
    
    buffer.seek(0)
    return buffer.getvalue()

def generate_analytics_pdf(crimes_by_type, district_freq, time_dist, period):
    """
    Generates a PDF showing KSP Crime Analytics dashboard data.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#FF7A00'),
        spaceAfter=12
    )
    
    section_title = ParagraphStyle(
        'SecTitle',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#18181b'),
        spaceBefore=15,
        spaceAfter=8
    )

    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#27272a')
    )

    bold_body = ParagraphStyle(
        'BoldBody',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#18181b')
    )

    story = []
    
    story.append(Paragraph("KSP CRIME ANALYTICS DASHBOARD REPORT", title_style))
    story.append(Paragraph(f"REPORTING PERIOD: {period.upper()} // SYSTEM EXPORT", body_style))
    story.append(Spacer(1, 15))
    
    # 1. Crime Type Breakdown
    story.append(Paragraph("1. Incident Breakdown by Crime Type", section_title))
    crime_data = [[Paragraph("Crime Type", bold_body), Paragraph("Incident Count", bold_body)]]
    for c in crimes_by_type:
        crime_data.append([Paragraph(str(c.get("type", "")), body_style), Paragraph(str(c.get("count", "")), body_style)])
    
    t1 = Table(crime_data, colWidths=[200, 100])
    t1.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e4e4e7')),
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f4f4f5')),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t1)
    
    # 2. District Frequency
    story.append(Paragraph("2. Top Incidents by Police District", section_title))
    dist_data = [[Paragraph("District Name", bold_body), Paragraph("Incident Volume", bold_body)]]
    for d in district_freq:
        dist_data.append([Paragraph(str(d.get("district", "")), body_style), Paragraph(f"{d.get('count', '')} (approx {d.get('percentage', '')}%)", body_style)])
    
    t2 = Table(dist_data, colWidths=[200, 100])
    t2.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e4e4e7')),
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f4f4f5')),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t2)
    
    # 3. Time Distribution
    story.append(Paragraph("3. Chronological Time-of-Day Distribution", section_title))
    time_data = [[Paragraph("Time Block", bold_body), Paragraph("Incident Share", bold_body)]]
    for t_item in time_dist:
        time_data.append([Paragraph(str(t_item.get("period", "")), body_style), Paragraph(str(t_item.get("count", "")), body_style)])
        
    t3 = Table(time_data, colWidths=[200, 100])
    t3.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e4e4e7')),
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f4f4f5')),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t3)
    
    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()

def generate_compliance_report_pdf(case_name, district_name, format_name, records):
    """
    Generates a PDF showing the full compliance report/dossier.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#FF7A00'),
        spaceAfter=12
    )

    h2_style = ParagraphStyle(
        'Heading2Style',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#18181b'),
        spaceBefore=12,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#27272a')
    )
    
    header_style = ParagraphStyle(
        'HeaderStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=colors.white
    )

    story = []
    
    story.append(Paragraph("KARNATAKA STATE POLICE — CASE DOSSIER", title_style))
    story.append(Paragraph("CONFIDENTIAL // SECURITY CLEARANCE REQUIRED // LAW ENFORCEMENT ONLY", ParagraphStyle('Conf', parent=styles['Normal'], textColor=colors.red, fontSize=9, fontName='Helvetica-Bold')))
    story.append(Spacer(1, 10))
    
    # Details Table
    details_data = [
        [Paragraph("Target Case File:", body_style), Paragraph(f"<b>{case_name}</b>", body_style)],
        [Paragraph("Assigned District:", body_style), Paragraph(f"<b>{district_name}</b>", body_style)],
        [Paragraph("Scope Format:", body_style), Paragraph(f"<b>{format_name}</b>", body_style)],
        [Paragraph("Total Linked FIRs:", body_style), Paragraph(f"<b>{len(records)}</b>", body_style)]
    ]
    t_details = Table(details_data, colWidths=[120, 300])
    t_details.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e4e4e7')),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_details)
    story.append(Spacer(1, 15))
    
    # Narrative Analysis
    story.append(Paragraph("Executive Summary & AI Briefing", h2_style))
    summary_text = (
        f"This compliance report compiles all active investigative records concerning the {case_name} "
        f"across the {district_name} jurisdiction. The multi-agent pipeline has aggregated database findings, "
        f"co-accused nodes, and vector intelligence to construct this dossier brief. The primary suspect is "
        f"flagged as a high-risk repeat offender operating within the district boundaries."
    )
    story.append(Paragraph(summary_text, body_style))
    story.append(Spacer(1, 15))
    
    # Linked FIR Records Table
    story.append(Paragraph("Linked Incident Records (SQLite)", h2_style))
    if records:
        table_data = [
            [
                Paragraph("FIR ID", header_style),
                Paragraph("Date", header_style),
                Paragraph("Crime Type", header_style),
                Paragraph("Suspect Name", header_style),
                Paragraph("Modus Operandi", header_style)
            ]
        ]
        for r in records:
            table_data.append([
                Paragraph(str(r.get("fir_id", "")), body_style),
                Paragraph(str(r.get("occurrence_date", "")), body_style),
                Paragraph(str(r.get("crime_type", "")), body_style),
                Paragraph(str(r.get("suspect_name", "")), body_style),
                Paragraph(str(r.get("modus_operandi", "")), body_style)
            ])
            
        t_records = Table(table_data, colWidths=[70, 60, 80, 80, 210])
        t_records.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#18181b')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e4e4e7')),
            ('PADDING', (0,0), (-1,-1), 5),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ]))
        story.append(t_records)
    else:
        story.append(Paragraph("<i>No records match the selected scope criteria.</i>", body_style))
        
    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
