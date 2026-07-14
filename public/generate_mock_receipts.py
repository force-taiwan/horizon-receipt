import os
import sys
from PIL import Image, ImageDraw, ImageFont

def generate_image(filename, text_lines):
    # Create a blank image with a light paper-like background color
    width, height = 800, 800
    image = Image.new("RGB", (width, height), "#fafafa")
    draw = ImageDraw.Draw(image)
    
    # Try to load a font, otherwise use default
    font = None
    try:
        font_paths = [
            "public/JasonHandwriting3.ttf",
            "public/ChenYuluoyan.ttf",
            "public/ZhiMangXing-Regular.ttf",
            "/System/Library/Fonts/PingFang.ttc",
            "/Library/Fonts/Arial Unicode.ttf"
        ]
        for path in font_paths:
            if os.path.exists(path):
                font = ImageFont.truetype(path, 30)
                break
    except Exception as e:
        print("Could not load custom font:", e)
        
    if font is None:
        font = ImageFont.load_default()
        
    # Draw simple ruled lines to simulate lined paper
    for y in range(80, height, 55):
        draw.line([(40, y), (width - 40, y)], fill="#e0e0e0", width=1)
        
    # Draw vertical red margin line
    draw.line([(80, 0), (80, height)], fill="#ffcccc", width=2)
    
    # Draw the handwritten text lines
    x_offset = 110
    y_offset = 100
    for line in text_lines:
        draw.text((x_offset, y_offset), line, fill="#1a237e", font=font)
        y_offset += 55
        
    image.save(filename)
    print(f"Successfully generated {filename}")

if __name__ == "__main__":
    # Mock receipt 1: ROC Citizen, salary/fee
    lines_1 = [
        "事由：AI 資訊服務費",
        "姓名：原力哥",
        "身分證字號：E123456789",
        "電話：0988168168",
        "市話：07-751-1688",
        "戶籍地址：台南市新化區中興路 168 號",
        "通訊地址：高雄是苓雅區廣東一街 168 號",
        "生日：1979 年 12 月 2 日",
        "金額：16888 元",
        "所得類別：執行業務所得"
    ]
    
    # Mock receipt 2: Foreign resident, rent
    lines_2 = [
        "Purpose: Office Rental Fee",
        "Name: John Smith (約翰史密斯)",
        "Citizenship: 外籍人士 (USA)",
        "Tax ID (稅籍編號): 9876543210",
        "ARC Number: AC87654321",
        "Mobile: 0912-987654",
        "Registered Address: 台北市大安區信義路四段 100 號",
        "Mailing Address: 台中市西屯區智惠街 20 號",
        "Birthday: 1988 年 10 月 12 日",
        "Amount: 28000 元",
        "所得類別：租金"
    ]
    
    generate_image("public/mock_handwritten_1.png", lines_1)
    generate_image("public/mock_handwritten_2.png", lines_2)
