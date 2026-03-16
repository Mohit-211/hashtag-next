const DemoCredentials = () => {
  return (
    <div className="bg-secondary rounded-lg p-3 space-y-1">
      <p className="text-[10px] font-bold uppercase text-muted-foreground">
        Demo Login Credentials
      </p>

      <p className="text-xs text-muted-foreground">
        Email: <span className="font-mono">demo@hashtagbillionaire.com</span>
      </p>

      <p className="text-xs text-muted-foreground">
        Password: <span className="font-mono">demo123</span>
      </p>
    </div>
  );
};

export default DemoCredentials;
