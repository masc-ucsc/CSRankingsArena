import yaml
import os
import argparse
from selenium import webdriver
from bs4 import BeautifulSoup

def update_yaml(url, output_file):
    """
    Scrapes an ACM digital library article page for paper information and stores in a yaml file.

    Args:
        url: ACM library article url
        output_file: Existing yaml file to update
    
    """
    if not os.path.exists(output_file):
        open(output_file, 'w').close()

    with open(output_file,'r') as yamlfile:
        yaml_content = yaml.safe_load(yamlfile)

    if not yaml_content:
        yaml_content = {}

    if not yaml_content.get('papers', None):
        yaml_content['papers'] = []

    options = webdriver.ChromeOptions()
    options.add_argument("--no-sandbox")

    dr = webdriver.Chrome(options=options)
    dr.get(url)
    page = BeautifulSoup(dr.page_source,"lxml")

    references = []
    for ref in page.find_all("div", attrs={"class":"citation-content"}):
        references.append(ref.text)

    # references = " ".join(references)

    title = page.find("div", attrs={"class": "core-publication-title"}).text

    abstract_section = page.find("section", attrs={"property":"abstract"})
    abstract_paragraphs = abstract_section.find_all("div", attrs={"role":"paragraph"})
    abstract = "\n".join([a.text for a in abstract_paragraphs])

    keywords_section = page.find("section", attrs={"id":"sec-terms"})
    keywords_elements = keywords_section.find_all("a")
    keywords = ",".join([k.text for k in keywords_elements])

    new_paper = {'abstract': abstract,
                    'keywords': keywords,
                    'title': title,
                    'url': url,
                    'references': references
                }

    yaml_content['papers'].append(new_paper)

    dr.close()

    with open(output_file,'w') as yamlfile:
        yaml.safe_dump(yaml_content, yamlfile)

    print(f"# of papers in YAML: {len(yaml_content['papers'])}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Download arXiv CS papers as PDFs or Markdown.")
    parser.add_argument(
        "--output-file", "-o", type=str, required=True,
        help="Yaml file to update"
    )
    args = parser.parse_args()

    while True:
        url = input('Enter an ACM digital library article url (Enter DONE to stop):\n')
        if url == "DONE":
            break
        update_yaml(url, args.output_file)


