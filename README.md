# CSRankingsArena


# Tools

## Download Papers

Sample command line to download 10 arXiv Hardware Architecture papers from 2024 in a yaml file

```
uv run .\paper_downloading\download_arxiv.py -f yaml --output-dir arxiv_papers -c AR -n 10
```

Sample command line to download arXiv Computer Science paper PDFs from February 1st 2023 to June 1st 2023

```
uv run .\paper_downloading\download_arxiv.py --output-dir arxiv_papers --start-date 20230201 --end-date 20230601
```
