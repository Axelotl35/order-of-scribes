from bs4 import BeautifulSoup

def parse(content):
    soup = BeautifulSoup(content, 'html.parser')
    levels = list(soup.find("div", class_="yui-content").findChildren(recursive=False))
    result = dict()
    levelNums = list(soup.find("ul", class_="yui-nav").findChildren(recursive=False))
    for lv, tab in enumerate(levels):
        level = "0" if levelNums[lv].find("em").text.strip() == "Cantrip" else levelNums[lv].find("em").text.strip()[0]
        result[level] = []
        table = list(tab.find("table", class_="wiki-content-table").findChildren(recursive=False))[1:]
        for spell in table:
            name = spell.find("a")
            result[level].append({
                "name": name.text.strip(),
                "description": "https://dnd5e.wikidot.com" + name.get("href")
            })
    return result
