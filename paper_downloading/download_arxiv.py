import requests
import feedparser
import time
import os
import argparse
import yaml
import re

# Comment these out if you don't need markdown conversion
from marker.converters.pdf import PdfConverter
from marker.models import create_model_dict
from marker.output import text_from_rendered


# Query for CS papers from 2024
# To change time period, change submittedDate:[YYYYMMDDHHMM+TO+YYYYMMDDHHMM]
BASE_URL = "http://export.arxiv.org/api/query?"


def download_arxiv_pdf(limit, output_dir, start_date, end_date, category):

    """
    Downloads arXiv papers as pdfs

    Args:
        limit: Maximum amount of papers to download
        output_dir: Directory to save pdfs to
        start_date: Query starting date in YYYYMMDD format
        end_date: Query ending date in YYYYMMDD format
    """

    query = f"search_query=cat:cs.{category}+AND+submittedDate:[{start_date}0000+TO+{end_date}2359]"

    os.makedirs(output_dir, exist_ok=True)
    start = 0
    max_results = min(100, limit)

    while True:
        if start >= limit:
            break

        url = f"{BASE_URL}{query}&start={start}&max_results={min(max_results, limit - start)}"
        response = requests.get(url)
        feed = feedparser.parse(response.text)

        if not feed.entries:
            break

        for entry in feed.entries:
            pdf_url = entry.id.replace('abs', 'pdf')
            paper_id = entry.id.split('/')[-1]
            pdf_filepath = f"{output_dir}/{paper_id}.pdf"

            print(pdf_url)
            if not os.path.exists(pdf_filepath):
                #print(f"Downloading {pdf_filepath}")
                pdf = requests.get(pdf_url + ".pdf")

                if pdf.status_code == 404:
                    print(f"{paper_id}: Paper does not have a PDF; Skipping")
                    continue

                with open(pdf_filepath, 'wb') as f:
                    f.write(pdf.content)
                time.sleep(1)

        start += max_results
        time.sleep(3)


def download_arxiv_md(limit, output_dir, start_date, end_date, category):

    """
    Downloads arXiv papers and converts to markdown

    Args:
        limit: Maximum amount of papers to download
        output_dir: Directory to save markdown to
        start_date: Query starting date in YYYYMMDD format
        end_date: Query ending date in YYYYMMDD format
    """

    os.makedirs(output_dir, exist_ok=True)
    os.makedirs("markdown_temp", exist_ok=True)

    start = 0
    max_results = min(100, limit)

    converter = PdfConverter(
        artifact_dict=create_model_dict(),
    )
    query = f"search_query=cat:cs.{category}+AND+submittedDate:[{start_date}0000+TO+{end_date}2359]"

    while True:
        if start >= limit:
            break

        url = f"{BASE_URL}{query}&start={start}&max_results={min(max_results, limit - start)}"
        response = requests.get(url)
        feed = feedparser.parse(response.text)

        if not feed.entries:
            break

        for entry in feed.entries:
            pdf_url = entry.id.replace('abs', 'pdf')
            paper_id = entry.id.split('/')[-1]
            pdf_filepath = f"markdown_temp/{paper_id}.pdf"
            md_filepath = f"{output_dir}/{paper_id}.md"
            print(f"Downloading {pdf_url}")
            
            if not os.path.exists(pdf_filepath):
                print(f"Downloading {pdf_filepath}")
                pdf = requests.get(pdf_url + ".pdf")

                if pdf.status_code == 404:
                    print(f"{paper_id}: Paper does not have a PDF; Skipping")
                    continue

                with open(pdf_filepath, 'wb') as p:
                    p.write(pdf.content)

                print(f"Converting {pdf_filepath} to {md_filepath}")
                with open(md_filepath, 'w', encoding="utf-8") as m:
                    rendered = converter(pdf_filepath)
                    text, _, _ = text_from_rendered(rendered)
                    m.write(text)

                # Delete pdf after conversion
                os.remove(pdf_filepath) 


        start += max_results
        time.sleep(3)

    try:
        os.rmdir("markdown_temp")
    except OSError:
        raise OSError("Failed to delete temporary files after execution")
    
def extract_metadata(sections, markdown_text=None):
    keywords = ""

    for key in sections:
        lowered = key.lower().replace('*', '').replace('_', ' ').strip()
        if not keywords and any(kw in lowered for kw in ["keywords", "key words", "index terms", "index term"]):
            keywords = re.sub(r'[_\n]+', ' ', sections[key]).strip()

    if not keywords and markdown_text:
        pattern = re.compile(
            r'\*(?:index terms|keywords|key words|index term)\*\s*[—\-–]?\s*(.+?)(?:\n|\#|\Z)', 
            re.IGNORECASE | re.DOTALL
        )
        match = pattern.search(markdown_text)
        if match:
            keywords = match.group(1).strip()
            keywords = keywords.split('\n')[0].strip()
            keywords = re.sub(r'\s+', ' ', keywords) 

    return keywords

def trim_document(markdown_text):
    intro_pattern = re.compile(
        r"(?m)^(?:#+\s*)?(?:\d+\.\d*\s*)?(?:[IVXLCDM]+\.\s*)?(?:Introduction|INTRODUCTION)\b"
    )
    
    match = intro_pattern.search(markdown_text)
    if match:
        return markdown_text[match.start():].strip()
    
    return markdown_text.strip()
    

def generate_yaml(limit, output_dir, start_date, end_date, category):

    """
    Generates a yaml file containing arXiv papers in markdown format

    Args:
        limit: Maximum amount of papers to download
        output_dir: Directory to save markdown to
        start_date: Query starting date in YYYYMMDD format
        end_date: Query ending date in YYYYMMDD format
    """

    os.makedirs(output_dir, exist_ok=True)
    os.makedirs("markdown_temp", exist_ok=True)

    start = 0
    max_results = min(100, limit)

    converter = PdfConverter(
        artifact_dict=create_model_dict(),
    )
    query = f"search_query=cat:cs.{category}+AND+submittedDate:[{start_date}0000+TO+{end_date}2359]"
    papers = []

    while True:
        if start >= limit:
            break

        url = f"{BASE_URL}{query}&start={start}&max_results={min(max_results, limit - start)}"
        response = requests.get(url)
        feed = feedparser.parse(response.text)

        if not feed.entries:
            break

        for entry in feed.entries:
            pdf_url = entry.id.replace('abs', 'pdf')
            paper_id = entry.id.split('/')[-1]
            pdf_filepath = f"markdown_temp/{paper_id}.pdf"
            md_filepath = f"{output_dir}/{paper_id}.md"
            print(f"Downloading {pdf_url}")
            
            if not os.path.exists(pdf_filepath):
                print(f"Downloading {pdf_filepath}")
                pdf = requests.get(pdf_url + ".pdf")
                
                if pdf.status_code == 404:
                    print(f"{paper_id}: Paper does not have a PDF; Skipping")
                    continue

                with open(pdf_filepath, 'wb') as p:
                    p.write(pdf.content)

                print(f"Converting {pdf_filepath} to {md_filepath}")
                rendered = converter(pdf_filepath)
                text, _, _ = text_from_rendered(rendered)
                keywords = extract_metadata({}, text)
                document = trim_document(text)
                papers.append({
                    "title": entry.title,
                    "abstract": entry.summary,
                    "url": entry.id,
                    "keywords": keywords,
                    "document": document
                })

                # Delete pdf after conversion
                if os.path.exists(pdf_filepath):
                    os.remove(pdf_filepath) 


        start += max_results
        time.sleep(3)

    output = {"papers": papers}
    with open(f"{output_dir}/papers.yaml", "w", encoding="utf-8") as f:
        yaml.dump(output, f, allow_unicode=True, sort_keys=False)

    try:
        os.rmdir("markdown_temp")
    except OSError:
        raise OSError("Failed to delete temporary files after execution")


if __name__ == "__main__":

    parser = argparse.ArgumentParser(description="Download arXiv CS papers as PDFs or Markdown.")
    parser.add_argument(
        "--format", "-f", choices=["pdf", "md", "yaml"], default="pdf",
        help="Output format: 'pdf' to download PDFs, 'md' to convert to markdown, 'yaml' for a single yaml file"
    )
    parser.add_argument(
        "--limit", "-n", type=int, default=10,
        help="Number of papers to download (default: 10)"
    )
    parser.add_argument(
        "--output-dir", "-o", type=str, default="arXiv_papers",
        help="Directory to save the output files"
    )
    parser.add_argument(
        "--start-date", type=str, default="20240101",
        help="Start date in YYYYMMDD format (default: 20240101)"
    )
    parser.add_argument(
        "--end-date", type=str, default="20241231",
        help="End date in YYYYMMDD format (default: 20241231)"
    )
    parser.add_argument(
        "--category", "-c", type=str, default="*",
        help="arXiv CS category ID (example: AR) (default: *)"
    )
    args = parser.parse_args()


    if args.format == "pdf":
        download_arxiv_pdf(args.limit, args.output_dir, args.start_date, args.end_date, args.category)
    elif args.format == "md":
        download_arxiv_md(args.limit, args.output_dir, args.start_date, args.end_date, args.category)
    else:
        generate_yaml(args.limit, args.output_dir, args.start_date, args.end_date, args.category)