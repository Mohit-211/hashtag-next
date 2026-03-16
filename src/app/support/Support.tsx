import Layout from "@/components/Layout";
import SupportHeader from "@/components/support/SupportHeader";
import SupportFAQ from "@/components/support/SupportFAQ";
import SupportContactForm from "@/components/support/SupportContactForm";
import SupportInfo from "@/components/support/SupportInfo";

const Support = () => {
  return (
    <Layout>
      <section className="py-10 lg:py-16">
        <div className="container max-w-4xl">
          <SupportHeader />

          <SupportFAQ />

          <SupportContactForm />

          <SupportInfo />
        </div>
      </section>
    </Layout>
  );
};

export default Support;
