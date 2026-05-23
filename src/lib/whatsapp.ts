export function generateWhatsAppMessage(
  lang: "ta" | "en",
  customerName: string,
  amount: number,
  shopName: string
) {
  const amountStr = "₹" + amount.toLocaleString("en-IN");
  let message = "";

  if (lang === "ta") {
    message = `வணக்கம் ${customerName},\n\nஉங்கள் பாக்கி தொகை ${amountStr}.\nதயவு செய்து செட்டில் பண்ணவும்.\n\n- ${shopName}`;
  } else {
    message = `Hello ${customerName},\n\nYour pending balance is ${amountStr}.\nPlease settle at your earliest convenience.\n\n- ${shopName}`;
  }

  return encodeURIComponent(message);
}

export function openWhatsAppReminder(
  phone: string,
  lang: "ta" | "en",
  customerName: string,
  amount: number,
  shopName: string
) {
  const msg = generateWhatsAppMessage(lang, customerName, amount, shopName);
  // Strip non-numeric characters from phone
  const cleanPhone = phone.replace(/\D/g, "");
  
  // If no country code and it's 10 digits (India assumed), prepend 91
  let finalPhone = cleanPhone;
  if (cleanPhone.length === 10) {
    finalPhone = "91" + cleanPhone;
  }

  const url = `https://wa.me/${finalPhone}?text=${msg}`;
  window.open(url, "_blank");
}
