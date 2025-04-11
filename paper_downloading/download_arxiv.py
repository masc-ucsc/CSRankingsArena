import requests
import feedparser
import time
import os

# Comment these out if you don't need markdown conversion
from marker.converters.pdf import PdfConverter
from marker.models import create_model_dict
from marker.output import text_from_rendered


# Query for CS papers from 2024
# To change time period, change submittedDate:[YYYYMMDDHHMM+TO+YYYYMMDDHHMM]
BASE_URL = "http://export.arxiv.org/api/query?"
QUERY = "search_query=cat:cs.*+AND+submittedDate:[202401010000+TO+202412312359]"


def download_arxiv_pdf(limit=100, output_dir="arxiv_pdf"):

    """
    Downloads arXiv papers as pdfs

    Args:
        limit: Maximum amount of papers to download
        output_dir: Directory to save pdfs to
    """

    os.makedirs(output_dir, exist_ok=True)
    start = 0
    max_results = min(100, limit)

    while True:
        if start >= limit:
            break

        url = f"{BASE_URL}{QUERY}&start={start}&max_results={min(max_results, limit - start)}"
        response = requests.get(url)
        feed = feedparser.parse(response.text)

        if not feed.entries:
            break

        for entry in feed.entries:
            pdf_url = entry.id.replace('abs', 'pdf')
            paper_id = entry.id.split('/')[-1]
            pdf_filepath = f"{output_dir}/{paper_id}.pdf"
            if not os.path.exists(pdf_filepath):
                print(f"Downloading {pdf_filepath}")
                pdf = requests.get(pdf_url + ".pdf")
                with open(pdf_filepath, 'wb') as f:
                    f.write(pdf.content)
                time.sleep(1)

        start += max_results
        time.sleep(3)


def download_arxiv_md(limit=100, output_dir="arxiv_md"):

    """
    Downloads arXiv papers and converts to markdown

    Args:
        limit: Maximum amount of papers to download
        output_dir: Directory to save markdown to

    """

    os.makedirs(output_dir, exist_ok=True)
    os.makedirs("markdown_temp", exist_ok=True)

    start = 0
    max_results = min(100, limit)

    converter = PdfConverter(
        artifact_dict=create_model_dict(),
    )

    while True:
        if start >= limit:
            break

        url = f"{BASE_URL}{QUERY}&start={start}&max_results={min(max_results, limit - start)}"
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

# TODO: Command line arguments
if __name__ == "__main__":
    download_arxiv_pdf(10)
    # download_arxiv_md(10)
