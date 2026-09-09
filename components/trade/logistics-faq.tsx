import { faqs } from "@/data/config/logistics"
import { Accordion } from "@/components/ui/accordion"

/*
  FAQ (Blueprint §6.4). Short, general questions only — no invented ports,
  countries, insurers, delivery times, partners, or route guarantees.
*/
export function LogisticsFaq() {
  const items = faqs.map((faq) => ({
    id: faq.id,
    trigger: faq.question,
    content: <p>{faq.answer}</p>,
  }))
  return <Accordion items={items} className="max-w-3xl" />
}
