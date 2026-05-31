import smtplib

try:
    server = smtplib.SMTP("smtp.gmail.com", 587)
    server.starttls()

    server.login(
        "legendwarriorking@gmail.com",
        "askdazswatjgihsz"
    )

    print("Login successful!")
    server.quit()

except Exception as e:
    print("Error:", e)