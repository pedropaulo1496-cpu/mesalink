"use client";

import { useState } from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

export default function PhoneField({
  name = "phone",
  defaultValue = "",
  required = false,
  placeholder = "Número de telemóvel",
}: {
  name?: string;
  defaultValue?: string;
  required?: boolean;
  placeholder?: string;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <>
      <PhoneInput
        international
        defaultCountry="PT"
        value={value}
        onChange={(next) => setValue(next || "")}
        placeholder={placeholder}
      />
      <input type="hidden" name={name} value={value || ""} required={required} />
    </>
  );
}
