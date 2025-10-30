const Footer = () => {
  return (
    <footer className="bg-secondary-background text-center py-4">
      <div className="container mx-auto">
        <p className="text-sm text-primary">
          &copy; {new Date().getFullYear()} SISC136
        </p>
      </div>
    </footer>
  );
};

export default Footer;
