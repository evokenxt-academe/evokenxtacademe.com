import type { TestimonialType } from "@/components/testimonial-list";
import { TestimonialList } from "@/components/testimonial-list";

export function Testimonials01() {
  return (
    <div className="bg-background py-16 md:py-20 lg:py-24">
      <div className="mx-auto mb-10 max-w-6xl px-4 md:px-6 lg:px-8">
        <p className="mb-2 text-center text-sm font-medium text-muted-foreground">
          Student Success
        </p>
        <h2 className="text-center text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Trusted by future leaders
        </h2>
      </div>
      <div className="flex flex-col gap-4 [&_.rfm-initial-child-container]:items-stretch! [&_.rfm-marquee]:items-stretch!">
        <TestimonialList data={TESTIMONIALS_1} />
        <TestimonialList data={TESTIMONIALS_2} direction="right" />
      </div>
    </div>
  );
}

const TESTIMONIALS_1: TestimonialType[] = [
  {
    authorAvatar:
      "https://lh3.googleusercontent.com/a/ACg8ocKSsBPhj7j3kxIoBRjclV-GvliwnKlxgjP316BzLwww2xy0fg=w81-h81-p-rp-mo-br100",
    authorName: "Sushma Mishra",
    authorTagline: "Parent of ACCA Student",
    url: "https://maps.app.goo.gl/a23Sb49cSjPTM3kc9",
    quote:
      "As a mother, I'm very happy with EVOKE. The teachers are helpful, and my child is learning well and staying motivated. They provide good support, regular tests, and keep students on track. I would definitely recommend them to other parents.",
  },
  {
    authorAvatar:
      "https://lh3.googleusercontent.com/a/ACg8ocI4eKKWDoAJePnjbUU7DivDfsHNSzx_duKF3KJpW0kuUJWEDEY=w81-h81-p-rp-mo-br100",
    authorName: "Uzma Shaikh",
    authorTagline: "ACCA Student",
    url: "https://maps.app.goo.gl/i7Cu52XGpvq7eVJ6A",
    quote:
      "Best classes for professional courses. It provides in-depth knowledge and clear explanations which made complex topics accessible. The course was well-structured, with practical insights and effective teaching methods. I gained a thorough understanding of the material and feel well-prepared for the exams. Highly recommended for anyone pursuing ACCA.",
  },
  {
    authorAvatar: "https://i.pravatar.cc/150?u=a04258114e29026702d",
    authorName: "Rizwan Azad",
    authorTagline: "Parent of ACCA Student",
    url: "https://maps.app.goo.gl/hjYaoHs37jDJQTj48",
    quote:
      "Evoke Academe is one of the finest coaching centres for commerce in Mumbai. They’ve great infrastructure and highly skilled and qualified teachers. Through professionals when it comes to teaching and helping with tips and tricks. They focus on scientific and cognitive learning so that you understand the concepts and not resort to rote learning. Go for it!",
  },
  {
    authorAvatar:
      "https://lh3.googleusercontent.com/a-/ALV-UjVLjhdxrNU4zwNS0FS5GqQQJnZPAuiNVr6h26s4L4nCNWar9cdy=w81-h81-p-rp-mo-br100",
    authorName: "Hasan Shaikh",
    authorTagline: "ACCA Student",
    url: "https://maps.app.goo.gl/QoyJykEXhPJZc3cF9",
    quote:
      "This class has a really unique and effective teaching style. The teacher is great at helping students adjust to the workload, and they're always encouraging us to keep going and reach our goals. I would personally recommend to join this classes .",
  },
  {
    authorAvatar:
      "https://lh3.googleusercontent.com/a/ACg8ocIjkH-060GpHv9SAqBmZ_GKZFZUIirNZKY5plrm9OH8DK41_A=w81-h81-p-rp-mo-br100",
    authorName: "farzeen shaikh",
    authorTagline: "ACCA Student",
    url: "https://maps.app.goo.gl/SVJaRFio9qVg8HgL8",
    quote:
      "The most underrated class for any commerce course, I am studying ACCA in this class and i am loving the way of their teaching. And the way I have improved while studying in this. I would genuinely recommend anyone to join this class if you can keep quality over show.",
  },
  {
    authorAvatar:
      "https://lh3.googleusercontent.com/a/ACg8ocJ8meBQFLNYZW6aLXwKQeLOYeWH-scMVnk3ni8J05PNDFTCWQ=w81-h81-p-rp-mo-br100",
    authorName: "Frazer Pereira",
    authorTagline: "ACCA Student",
    url: "https://maps.app.goo.gl/yZNoDF18ynhJx1F18",
    quote:
      "Choosing Evoke Academe for my ACCA studies was a wise decision. The faculty's dedication, combined with interactive teaching methods, has significantly boosted my confidence in tackling the exams.",
  },
];

const TESTIMONIALS_2: TestimonialType[] = [
  {
    authorAvatar:
      "https://lh3.googleusercontent.com/a/ACg8ocL8EHYyedN3Ej54QBIAfEOi3CCE0Mm4EHYjatvlPsg6YVidKw=w81-h81-p-rp-mo-br100",
    authorName: "Prashant Hogade",
    authorTagline: "ACCA Student",
    url: "https://maps.app.goo.gl/o4mw1yuKPCBok2JH8",
    quote:
      "Evoke Academe is the perfect place to pursue ACCA classes. The trainers are highly experienced and ensure that concepts are well understood before moving on. They create a supportive environment that fosters growth.",
  },
  {
    authorAvatar:
      "https://lh3.googleusercontent.com/a/ACg8ocK3hTzulSZYYyN0X-yu9ZICxKPhk2SAzPpCDMJomNYJNf3o1g=w81-h81-p-rp-mo-br100",
    authorName: "Kashaf Shaikh",
    authorTagline: "ACCA Student",
    url: "https://maps.app.goo.gl/wg7LPY1XBMqawu2A7",
    quote:
      "The structure and pace of the teacher made complex topics easy to understand, the teaching style encourages active participation and friendliness. Study materials provided here are extremely helpful, relatable and easy to grasp.",
  },
  {
    authorAvatar:
      "https://lh3.googleusercontent.com/a/ACg8ocJYnp2kJ9spnIYlnM4UGjbH4teupesuoi-iK-0JsvAzaa038Uc=w81-h81-p-rp-mo-br100",
    authorName: "Mohammed wasim Bhati",
    authorTagline: "ACCA Student",
    url: "https://maps.app.goo.gl/yE6rriLMKYXFeigY7",
    quote:
      "Evoke Academe has a well-structured curriculum for ACCA classes. The systematic approach, combined with regular assessments, ensures that we stay on track and steadily progress towards our goals.",
  },
  {
    authorAvatar: "https://i.pravatar.cc/150?u=a042581f4e29026704g",
    authorName: "Omar S.",
    authorTagline: "Business Analyst",
    url: "#",
    quote:
      "World-class instructors. You can tell they actually care about your success, not just finishing the syllabus.",
  },
  {
    authorAvatar:
      "https://lh3.googleusercontent.com/a/ACg8ocIitIjzANuEg69PERpffp2HVIXI6gHB7wXok8n88x_n0o56ew=w81-h81-p-rp-mo-br100",
    authorName: "Mohammed Qadri",
    authorTagline: "ACCA Student",
    url: "https://maps.app.goo.gl/WWxtzxaRdVgmJstY9",
    quote:
      "Best ACCA classes in Mira road .also concepts are very clear and teachers are very helpful to us . Also class tests  are taken on time which helps the student to be prepared for the final exams",
  },
  {
    authorAvatar:
      "https://lh3.googleusercontent.com/a-/ALV-UjVHw8DLzaEjNkZPNsppvKJHBUVdQPhgFYXIFdlvnyURFQusCR0A=w81-h81-p-rp-mo-br100",
    authorName: "Mukul Singh",
    authorTagline: "ACCA Student",
    url: "https://maps.app.goo.gl/VBtLMPis5aBJZtRG6",
    quote:
      "What makes you willingly attend lectures? That's what they portray at Evoke Academe. Meaning, lectures with sheer wisdom with real world examples that makes concept retention in long run. Found it engrossing and full of perception. Highly recommended!!",
  },
];
