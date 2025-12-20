import React from "react";

const HappyBirthday = () => {
  return (
    <>
      <style>{`
        .banner-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: 2.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 28px;
          box-shadow: 0 12px 30px -6px rgba(0, 0, 0, 0.35);
          color: white;
          font-family: system-ui, -apple-system, sans-serif;
          width: 90%;
          max-width: 900px;
          margin: 4rem auto;
          gap: 24px;
          position: relative;
          overflow: hidden;
          text-align: center;
          animation: fadeIn 1s ease-out;
        }

        @media (min-width: 768px) {
          .banner-container {
            flex-direction: row;
            text-align: left;
            padding: 3rem;
          }
        }

        .banner-container::before,
        .banner-container::after {
          content: "";
          position: absolute;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.08);
          animation: float 6s ease-in-out infinite;
        }

        .banner-container::before {
          top: -60px;
          left: -60px;
        }

        .banner-container::after {
          bottom: -60px;
          right: -60px;
        }

        h1 {
          margin: 0;
          font-size: 2.8rem;
          font-weight: 800;
          line-height: 1.2;
          background: linear-gradient(90deg, #ffecd2, #fcb69f);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 3px 6px rgba(0,0,0,0.25);
        }

        .profile-pic {
          width: 140px;
          height: 140px;
          border-radius: 50%;
          border: 5px solid rgba(255, 255, 255, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: rgba(255, 255, 255, 0.15);
          overflow: hidden;
          flex-shrink: 0;
          position: relative;
          transition: transform 0.3s ease;
        }

        .profile-pic:hover {
          transform: scale(1.05) rotate(3deg);
        }

        .profile-pic img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
      `}</style>

      <div className="banner-container">
        <div style={{ flex: "1", minWidth: "250px", zIndex: 2 }}>
          <h1>
            Happy Birthday, <br /> Jimmy! 🎉
          </h1>
        </div>

        <div className="profile-pic">
          <img
            src={"../images/jimmypic.png"}
            alt="Jimmy not found"
          />
        </div>
      </div>
    </>
  );
};

export default HappyBirthday;
