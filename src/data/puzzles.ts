export interface PuzzleTheme {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  rarity: "Chưa định" | "Thường" | "Hiếm" | "Huyền Thoại";
  goldReward: number;
  totalPieces: number;
}

export const PUZZLE_THEMES: PuzzleTheme[] = [
  {
    id: "halong_bay",
    name: "Kỳ Quan Vịnh Hạ Long",
    description: "Kỳ quan thiên nhiên thế giới nổi tiếng với hàng nghìn đảo đá vôi kỳ vĩ nổi trên làn nước xanh ngọc bích cực kỳ tráng lệ.",
    imageUrl: "https://images.unsplash.com/photo-1528127269322-539801943592?w=800&auto=format&fit=crop",
    rarity: "Hiếm",
    goldReward: 150,
    totalPieces: 12,
  },
  {
    id: "fire_dragon",
    name: "Rồng Lửa Thời Lý",
    description: "Sinh vật huyền thoại biểu tượng cho vương quyền, tri thức và sức mạnh vô song trong truyền thuyết Việt Nam cổ xưa.",
    imageUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80",
    rarity: "Huyền Thoại",
    goldReward: 300,
    totalPieces: 12,
  },
  {
    id: "ancient_scholar",
    name: "Bảo Tàng Albert Einstein",
    description: "Một trong những bộ óc vĩ đại nhất lịch sử nhân loại, người khai sáng thuyết tương đối, biểu tượng của sự sáng tạo bất tận.",
    imageUrl: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800&auto=format&fit=crop",
    rarity: "Thường",
    goldReward: 100,
    totalPieces: 12,
  },
];

export interface PreloadedMaterial {
  id: string;
  title: string;
  category: string;
  description: string;
  content: string;
  icon: string;
}

export const PRELOADED_MATERIALS: PreloadedMaterial[] = [
  {
    id: "math_adventure",
    title: "Thần Điện Phương Trình & Đại Số Tuyến Tính",
    category: "Toán học",
    description: "Giải mã các ẩn số x, y, z phức tạp, các ma trận phương trình, rèn luyện tư duy logic toán học tối cao và phân tích sắc bén.",
    icon: "📐",
    content: `Chủ đề học tập: Toán Học Giải Tích và Đại Số Lớp 10-12.
1. Khái niệm về Hàm Số và Đạo Hàm: Đạo hàm biểu thị tốc độ biến thiên của một đại lượng. Ý nghĩa hình học của đạo hàm tại một điểm là hệ số góc của tiếp tuyến của đồ thị hàm số tại điểm đó.
2. Phương trình bậc hai và hệ phương trình tuyến tính: Cách tìm nghiệm bằng biệt thức Delta, và ứng dụng định lý Vi-ét để liên kết nghiệm với các hệ số của phương trình.
3. Vectơ và Hệ tọa độ Oxyz: Khái niệm vectơ biểu diễn cả hướng và độ lớn. Tích vô hướng của hai vectơ dùng để xác định góc giữa chúng (và điều kiện vuông góc khi tích vô hướng bằng 0). Tích có hướng của hai vectơ dùng để tìm vectơ pháp tuyến của mặt phẳng.`
  },
  {
    id: "physics_expedition",
    title: "Bản Nguyên Cơ Học & Các Định Luật Vũ Trụ",
    category: "Vật lý",
    description: "Khám phá thế giới của các định luật Isaac Newton, động lực học chất điểm, sự bảo toàn năng lượng và quang học huyền bí.",
    icon: "⚡",
    content: `Chủ đề học tập: Động Lực Học & Cơ Học Vật Lý.
1. Ba định luật Newton về chuyển động:
- Định luật I (Quán tính): Một vật sẽ giữ nguyên trạng thái đứng yên hoặc chuyển động thẳng đều nếu không chịu tác dụng của lực nào hoặc hợp lực bằng 0.
- Định luật II: Gia tốc của một vật tỉ lệ thuận với lực tác dụng lên vật và tỉ lệ nghịch với khối lượng của vật (F = m.a).
- Định luật III: Khi vật A tác dụng lên vật B một lực, thì vật B cũng tác dụng lại vật A một lực trực đối (lực và phản lực).
2. Định luật bảo toàn động lượng và năng lượng: Cơ năng của một vật (tổng thế năng và động năng) được bảo toàn trong trọng trường khi không có ma sát.
3. Quang học và sóng ánh sáng: Hiện tượng khúc xạ ánh sáng tuân theo định luật Snell (n1.sin(i) = n2.sin(r)). Sóng ánh sáng có tính chất lưỡng tính sóng - hạt.`
  },
  {
    id: "chemistry_alchemist",
    title: "Thuật Giả Kim Hiện Đại & Liên Kết Nguyên Tử",
    category: "Hóa học",
    description: "Nghiên cứu cấu trúc vỏ electron, liên kết cộng hóa trị, bảng tuần hoàn Mendeleev và các phản ứng hóa học kỳ ảo.",
    icon: "🧪",
    content: `Chủ đề học tập: Hóa học Đại cương & Vô cơ / Hữu cơ.
1. Cấu tạo nguyên tử và Bảng tuần hoàn Mendeleev: Nguyên tử gồm hạt nhân mang điện tích dương (proton, neutron) và vỏ mang điện tích âm (electron). Bảng tuần hoàn sắp xếp các nguyên tố theo chiều tăng dần của điện tích hạt nhân, thể hiện tính tuần hoàn về tính chất kim loại, phi kim, bán kính nguyên tử và độ âm điện.
2. Các loại liên kết hóa học:
- Liên kết ion: Được hình thành bởi lực hút tĩnh điện giữa các ion mang điện tích trái dấu (kim loại điển hình và phi kim điển hình).
- Liên kết cộng hóa trị: Được hình thành giữa hai nguyên tử bằng một hay nhiều cặp electron dùng chung (phi kim với phi kim).
3. Phản ứng oxi hóa - khử: Là phản ứng hóa học trong đó có sự chuyển dịch electron giữa các chất phản ứng. Chất khử là chất nhường electron (số oxi hóa tăng), chất oxi hóa là chất nhận electron (số oxi hóa giảm).`
  },
  {
    id: "biology_genesis",
    title: "Mật Mã Sự Sống & Cấu Trúc Di Truyền DNA",
    category: "Sinh học",
    description: "Giải mã cấu trúc xoắn kép Watson-Crick tuyệt mỹ, quy luật di truyền Gregor Mendel và cơ chế tiến hóa sinh giới.",
    icon: "🧬",
    content: `Chủ đề học tập: Di truyền học & Sinh học phân tử.
1. Cấu trúc hóa học và không gian của DNA: DNA được cấu tạo theo nguyên tắc đa phân, với các đơn phân là 4 loại nucleotide: A (Adenine), T (Thymine), G (Guanine), C (Cytosine). Mô hình Watson - Crick là chuỗi xoắn kép gồm hai mạch polynucleotide chạy song song ngược chiều, liên kết với nhau theo nguyên tắc bổ sung: A liên kết với T bằng 2 liên kết hydro, G liên kết với C bằng 3 liên kết hydro.
2. Quá trình truyền đạt thông tin di truyền:
- Nhân đôi DNA: Diễn ra trong nhân tế bào, nhân đôi theo nguyên tắc bổ sung và bán bảo toàn (mỗi DNA con giữ lại một mạch cũ).
- Phiên mã: Tổng hợp mRNA từ mạch khuôn DNA.
- Dịch mã: mRNA làm khuôn để tổng hợp chuỗi polypeptide (protein) tại ribosome dưới sự hỗ trợ của tRNA.
3. Quy luật di truyền của Mendel: Quy luật phân ly (mỗi tính trạng do một cặp alen quy định) và Quy luật phân ly độc lập (các cặp alen phân ly độc lập trong quá trình phát sinh giao tử).`
  },
  {
    id: "geography_chronicles",
    title: "Bản Đồ Kiến Tạo Địa Chất & Khí Hậu Địa Cầu",
    category: "Địa lý",
    description: "Thám hiểm kiến tạo mảng hành tinh, các đai áp và gió lớn, đặc điểm địa hình, sông ngòi và các vùng khí hậu đa dạng.",
    icon: "🗺️",
    content: `Chủ đề học tập: Địa lý Tự nhiên & Kinh tế Xã hội.
1. Thuyết kiến tạo mảng: Thạch quyển được cấu tạo từ các mảng kiến tạo lớn nhỏ. Do hoạt động của các dòng đối lưu trong bao manti, các mảng này di chuyển chậm chạp. Nơi hai mảng xô vào nhau hình thành các dãy núi cao hoặc rãnh đại dương và thường xảy ra động đất, núi lửa. Nơi hai mảng tách xa nhau tạo ra các sống núi ngầm giữa đại dương.
2. Các đai khí áp và gió trên Trái Đất: Trái Đất có 7 đai khí áp xen kẽ (áp thấp xích đạo, áp cao cận chí tuyến, áp thấp ôn đới, áp cao cực). Các loại gió chính gồm: Gió Tín phong (thổi từ áp cao cận chí tuyến về áp thấp xích đạo) và Gió Tây ôn đới (thổi từ áp cao cận chí tuyến về áp thấp ôn đới).
3. Địa lý Việt Nam: Nằm trong vùng nội chí tuyến nửa cầu Bắc, thiên nhiên mang tính chất nhiệt đới ẩm gió mùa sâu sắc. Địa hình đồi núi chiếm 3/4 diện tích lãnh thổ nhưng chủ yếu là đồi núi thấp.`
  },
  {
    id: "language_arcane",
    title: "Cổ Ngữ Ngoại Bang & Ngữ Pháp Tiếng Anh Thần Sầu",
    category: "Ngoại ngữ",
    description: "Nâng cấp kỹ năng đàm thoại, từ vựng học thuật cao cấp và các cấu trúc ngữ pháp như câu điều kiện, câu bị động.",
    icon: "🗣️",
    content: `Chủ đề học tập: Ngữ pháp Tiếng Anh nâng cao & Từ vựng.
1. Các thì cơ bản và nâng cao (Verb Tenses):
- Present Perfect (Hiện tại hoàn thành): Diễn tả hành động bắt đầu trong quá khứ kéo dài đến hiện tại và có khả năng tiếp diễn (S + have/has + V3/Ved).
- Past Perfect (Quá khứ hoàn thành): Diễn tả hành động xảy ra trước một hành động khác trong quá khứ (S + had + V3/Ved).
2. Câu điều kiện (Conditional Sentences):
- Loại 1: Diễn tả điều kiện có thật ở hiện tại hoặc tương lai (If + S + V(s/es), S + will + V-inf).
- Loại 2: Diễn tả điều kiện không có thật ở hiện tại (If + S + V2/Ved(were), S + would + V-inf).
- Loại 3: Diễn tả điều kiện trái với thực tế trong quá khứ (If + S + had + V3/Ved, S + would have + V3/Ved).
3. Câu bị động (Passive Voice) & Mệnh đề quan hệ (Relative Clauses): Cách chuyển đổi tân ngữ thành chủ ngữ mới và sử dụng các đại từ quan hệ Who, Whom, Which, That, Whose để nối các mệnh đề lại với nhau.`
  },
  {
    id: "history_legends",
    title: "Huyền Thoại Đông Đô & Kháng Chiến Chống Nguyên Mông",
    category: "Lịch sử",
    description: "Tái hiện 3 lần chiến đấu oanh liệt của nhà Trần trước kỵ binh Mông Cổ hung hãn, hội nghị Diên Hồng và sông Bạch Đằng lịch sử.",
    icon: "⚔️",
    content: `Chủ đề học tập: Lịch sử Đại Việt thời Trần (Thế kỷ XIII).
Vào thế kỷ XIII, quân dân nhà Trần ở Đại Việt đã lập nên kỳ tích ba lần đánh bại quân xâm lược Mông - Nguyên hùng mạnh bậc nhất thế giới (1258, 1285, 1287-1288).
1. Lần thứ nhất (1258): Ngột Lương Hợp Thai dẫn quân vào Đại Việt. Vua Trần Thái Tông cùng Thái sư Trần Thủ Độ tổ chức kháng chiến. Áp dụng chiến thuật "Vườn không nhà trống" rút khỏi Thăng Long, giặc đói khát suy yếu, ta phản công đại thắng ở Đông Bộ Đầu.
2. Lần thứ hai (1285): Thoát Hoan dẫn 50 vạn quân xâm lược. Thử thách cực kỳ cam go. Hưng Đạo Vương Trần Quốc Tuấn viết "Hịch tướng sĩ" cổ vũ tinh thần. Hội nghị Diên Hồng quy tụ ý chí toàn dân. Quân dân nhà Trần chiến thắng oanh liệt ở Hàm Tử, Chương Dương, Tây Kết, chém đầu tướng giặc Toa Đô.
3. Lần thứ ba (1287-1288): Trận Bạch Đằng (1288) vang dội sử sách. Trần Hưng Đạo dùng kế cắm cọc gỗ bịt sắt xuống lòng sông Bạch Đằng, nhử chiến thuyền giặc vào bãi cọc lúc triều rút. Hạm đội thủy binh giặc do Ô Mã Nhi chỉ huy bị tiêu diệt hoàn toàn.`
  },
  {
    id: "literature_secrets",
    title: "Cổ Linh Thơ Ca & Tinh Hoa Văn Chương Việt Nam",
    category: "Ngữ văn",
    description: "Cảm thụ những tuyệt tác Truyện Kiều, thơ ca cách mạng và văn xuôi hiện đại Việt Nam đầy nhân văn sâu sắc.",
    icon: "✍️",
    content: `Chủ đề học tập: Ngữ văn Trung đại & Hiện đại Việt Nam.
1. Văn học trung đại (Truyện Kiều - Nguyễn Du): Thể thơ Lục bát truyền thống đạt đến đỉnh cao rực rỡ. Nguyễn Du thể hiện tinh thần nhân đạo sâu sắc, xót thương cho số phận hồng nhan bạc mệnh của Thúy Kiều, tố cáo xã hội phong kiến phong kiến chà đạp con người, đồng thời ca ngợi khát vọng tự do và công lý (qua hình tượng Từ Hải).
2. Thơ ca Cách mạng kháng chiến: Sáng tác trong hai cuộc kháng chiến chống Pháp và chống Mỹ. Các tác phẩm nổi bật như "Đồng chí" (Chính Hữu) ca ngợi tình đồng chí, đồng đội keo sơn gắn bó xuất phát từ tình cảnh nghèo khó chung và chung lý tưởng chiến đấu; "Tây Tiến" (Quang Dũng) khắc họa vẻ đẹp bi tráng, lãng mạn của người lính kiêu hùng giữa núi rừng miền Tây hiểm trở.
3. Văn xuôi hiện đại (Nam Cao, Nguyễn Tuân): Nam Cao với chủ nghĩa hiện thực phê phán, khai thác tấn bi kịch tinh thần của người nông dân bị tha hóa ("Chí Phèo") và người trí thức nghèo bị ghì sát đất ("Đời thừa"). Nguyễn Tuân nổi tiếng với phong cách tài hoa, uyên bác, xem con người ở phương diện nghệ sĩ ("Người lái đò Sông Đà").`
  }
];
