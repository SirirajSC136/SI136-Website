const Footer = () => {
  return (
    <footer className="bg-slate-100 text-center py-4 mt-8">
      <div className="container mx-auto">
        <p className="text-sm text-slate-600">
          &copy; {new Date().getFullYear()} SISC136
        </p>
      </div>
    </footer>
  );
};

export default Footer;
