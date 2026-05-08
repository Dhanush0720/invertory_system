import sys
import pywhatkit as kit

def send_whatsapp(phone_no, message):
    """
    Sends a WhatsApp message using browser automation.
    Requires:
    1. pip install pywhatkit
    2. User must be logged into WhatsApp Web in their default browser.
    """
    try:
        print(f"Opening browser to send WhatsApp to {phone_no}...")
        # Send instantly: 15 sec wait for whatsapp web to load, close tab after sending, wait 4 sec to close
        kit.sendwhatmsg_instantly(phone_no, message, int(15), True, int(4))
        print("Message sent successfully!")
        return True
    except Exception as e:
        print(f"Failed to send WhatsApp message: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python whatsapp_sender.py <phone_number_with_country_code> <message>")
        sys.exit(1)
        
    phone = sys.argv[1]
    msg = sys.argv[2]
    
    # Optional 3rd arg (API key) is ignored since we rolled back to pywhatkit
    
    ok = send_whatsapp(phone, msg)
    sys.exit(0 if ok else 1)
