import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { FAQ_SECTIONS } from "@/data/supportData";

const SupportFAQ = () => {
  return (
    <div className="mb-16 space-y-8">
      <h2 className="text-xl font-heading font-bold">
        Frequently Asked Questions
      </h2>

      {FAQ_SECTIONS.map((section) => (
        <div key={section.title} className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase">
            {section.title}
          </h3>

          <Accordion
            type="multiple"
            className="border rounded-xl overflow-hidden"
          >
            {section.items.map((item, i) => (
              <AccordionItem key={i} value={`${section.title}-${i}`}>
                <AccordionTrigger className="px-5 py-4 text-sm font-medium">
                  {item.q}
                </AccordionTrigger>

                <AccordionContent className="px-5 pb-4 text-sm text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      ))}
    </div>
  );
};

export default SupportFAQ;
