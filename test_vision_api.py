import base64
import json
import requests

def test_vision_extraction(image_path):
    print(f"--- Testing image extraction for {image_path} ---")
    
    # Read the image file and convert to base64
    with open(image_path, "rb") as image_file:
        encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
        
    # Prepare payload
    payload = {
        "text": "",
        "currentState": {},
        "image": f"data:image/png;base64,{encoded_string}"
    }
    
    url = "http://localhost:8787/api/parse"
    headers = {"Content-Type": "application/json"}
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        print("Status Code:", response.status_code)
        if response.status_code == 200:
            result = response.json()
            print("Extracted Data:")
            print(json.dumps(result, indent=2, ensure_ascii=False))
        else:
            print("Error response:", response.text)
    except Exception as e:
        print("Request failed:", e)

if __name__ == "__main__":
    # Test with mock_handwritten_1.png
    test_vision_extraction("public/mock_handwritten_1.png")
