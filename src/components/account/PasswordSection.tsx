{
  active === "password" && (
    <div className="bg-card border border-border rounded-xl p-6 lg:p-8 space-y-6">
      <div>
        <h2 className="text-xl font-heading font-bold text-foreground">
          Change Password
        </h2>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          Keep your account secure by updating your password regularly. Choose a
          strong password that you don't use on other websites.
        </p>
      </div>
      <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">
            Current Password
          </label>
          <div className="relative">
            <input
              type={showCurrentPw ? "text" : "password"}
              value={currentPw}
              onChange={(e) => {
                setCurrentPw(e.target.value);
                setPwMessage("");
              }}
              className={`${inputClass} pr-10`}
              placeholder="Enter current password"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPw(!showCurrentPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showCurrentPw ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">
            New Password
          </label>
          <div className="relative">
            <input
              type={showNewPw ? "text" : "password"}
              value={newPw}
              onChange={(e) => {
                setNewPw(e.target.value);
                setPwMessage("");
              }}
              className={`${inputClass} pr-10`}
              placeholder="Min 6 characters"
            />
            <button
              type="button"
              onClick={() => setShowNewPw(!showNewPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showNewPw ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">
            Confirm New Password
          </label>
          <input
            type="password"
            value={confirmPw}
            onChange={(e) => {
              setConfirmPw(e.target.value);
              setPwMessage("");
            }}
            className={inputClass}
            placeholder="Re-enter new password"
          />
        </div>
        {pwMessage && (
          <p
            className={`text-sm ${
              pwMessage.includes("success")
                ? "text-foreground"
                : "text-destructive"
            }`}
          >
            {pwMessage}
          </p>
        )}
        <Button
          type="submit"
          variant="hero"
          className="rounded-lg"
          disabled={!pwValid}
        >
          Update Password
        </Button>
      </form>
    </div>
  );
}
