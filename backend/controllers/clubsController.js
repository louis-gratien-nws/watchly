const Club = require("../models/Club");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { emitClubEventToUsers, subscribeUserClubEvents } = require("../services/clubEvents");

const createInviteCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

const isClubMember = (club, userId) => club.members.some((member) => String(member.userId) === String(userId));

const getMember = (club, userId) => club.members.find((member) => String(member.userId) === String(userId));

const canManage = (club, userId) => {
  const member = getMember(club, userId);
  if (!member) return false;
  return ["owner", "admin"].includes(member.role);
};

const ensureMembership = (club, userId, res) => {
  if (!isClubMember(club, userId)) {
    res.status(403).json({ message: "You are not a member of this club" });
    return false;
  }
  return true;
};

const touchMemberActivity = (club, userId) => {
  const member = getMember(club, userId);
  if (member) {
    member.lastActiveAt = new Date();
  }
};

const addPoints = (club, userId, points) => {
  const member = getMember(club, userId);
  if (!member) return;
  member.points = (member.points || 0) + points;
  member.lastActiveAt = new Date();
};

const formatClubListItem = (club, userId) => {
  const member = getMember(club, userId);
  return {
    _id: club._id,
    name: club.name,
    description: club.description,
    inviteCode: club.inviteCode,
    memberCount: club.members.length,
    role: member?.role || "member",
    points: member?.points || 0,
    updatedAt: club.updatedAt
  };
};

const generateUniqueInviteCode = async () => {
  for (let i = 0; i < 8; i += 1) {
    const candidate = createInviteCode();
    const existing = await Club.findOne({ inviteCode: candidate }).select("_id");
    if (!existing) return candidate;
  }

  throw new Error("Could not generate unique invite code");
};

const toObjectIdList = (club) => club.members.map((member) => String(member.userId));

const clubNotificationQuery = {
  targetType: "Club",
  type: { $in: ["club_post", "club_vote"] }
};

const appendAuditLog = (club, payload) => {
  club.auditLogs = club.auditLogs || [];
  club.auditLogs.unshift({
    action: payload.action,
    actorId: payload.actorId,
    actorUsername: payload.actorUsername,
    targetUserId: payload.targetUserId,
    targetUsername: payload.targetUsername,
    metadata: payload.metadata || {},
    createdAt: new Date()
  });

  if (club.auditLogs.length > 200) {
    club.auditLogs = club.auditLogs.slice(0, 200);
  }
};

const decreaseUserUnreadCount = async (userId, count) => {
  if (!count) return;

  const user = await User.findById(userId).select("unreadNotifications");
  if (!user) return;

  user.unreadNotifications = Math.max(0, (user.unreadNotifications || 0) - count);
  await user.save();
};

const fanoutClubNotification = async ({ club, actorId, actorUsername, type, message }) => {
  const memberIds = toObjectIdList(club);
  const recipients = memberIds.filter((userId) => String(userId) !== String(actorId));

  if (recipients.length) {
    const notifications = recipients.map((recipientId) => ({
      recipientId,
      senderId: actorId,
      type,
      message,
      targetId: club._id,
      targetType: "Club"
    }));

    await Notification.insertMany(notifications);
    await User.updateMany(
      { _id: { $in: recipients } },
      { $inc: { unreadNotifications: 1 } }
    );
  }

  emitClubEventToUsers(memberIds, {
    clubId: String(club._id),
    type,
    message,
    actorId: String(actorId),
    actorUsername,
    createdAt: new Date().toISOString()
  });
};

const listMyClubs = async (req, res, next) => {
  try {
    const clubs = await Club.find({ "members.userId": req.user._id })
      .sort({ updatedAt: -1 })
      .select("name description inviteCode members updatedAt");

    return res.json(clubs.map((club) => formatClubListItem(club, req.user._id)));
  } catch (error) {
    return next(error);
  }
};

const createClub = async (req, res, next) => {
  try {
    const { name, description = "" } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ message: "name is required" });
    }

    const inviteCode = await generateUniqueInviteCode();

    const club = await Club.create({
      name: name.trim(),
      description,
      ownerId: req.user._id,
      inviteCode,
      members: [{ userId: req.user._id, role: "owner", points: 25 }],
      posts: [],
      polls: []
    });

    return res.status(201).json(formatClubListItem(club, req.user._id));
  } catch (error) {
    return next(error);
  }
};

const joinClubByCode = async (req, res, next) => {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode?.trim()) {
      return res.status(400).json({ message: "inviteCode is required" });
    }

    const club = await Club.findOne({ inviteCode: inviteCode.trim().toUpperCase() });
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    if (isClubMember(club, req.user._id)) {
      return res.json({ message: "Already a member", club: formatClubListItem(club, req.user._id) });
    }

    club.members.push({ userId: req.user._id, role: "member", points: 5 });
    club.posts.unshift({ authorId: req.user._id, content: `${req.user.username} a rejoint le club.` });
    await club.save();

    emitClubEventToUsers(toObjectIdList(club), {
      clubId: String(club._id),
      type: "club_post",
      message: `${req.user.username} a rejoint le club.`,
      actorId: String(req.user._id),
      actorUsername: req.user.username
    });

    return res.json({ message: "Joined", club: formatClubListItem(club, req.user._id) });
  } catch (error) {
    return next(error);
  }
};

const getClubDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const club = await Club.findById(id)
      .populate("members.userId", "username avatar")
      .populate("posts.authorId", "username avatar")
      .populate("polls.createdBy", "username avatar");

    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    if (!ensureMembership(club, req.user._id, res)) return;

    const me = getMember(club, req.user._id);
    const clubUnreadCount = await Notification.countDocuments({
      ...clubNotificationQuery,
      recipientId: req.user._id,
      targetId: club._id,
      read: false
    });

    return res.json({
      _id: club._id,
      name: club.name,
      description: club.description,
      inviteCode: club.inviteCode,
      role: me?.role || "member",
      clubUnreadCount,
      memberCount: club.members.length,
      members: club.members
        .map((member) => ({
          userId: member.userId?._id || member.userId,
          username: member.userId?.username || "Membre",
          avatar: member.userId?.avatar || "",
          role: member.role,
          points: member.points || 0,
          joinedAt: member.joinedAt,
          lastActiveAt: member.lastActiveAt
        }))
        .sort((a, b) => b.points - a.points),
      posts: club.posts
        .map((post) => ({
          _id: post._id,
          content: post.content,
          createdAt: post.createdAt,
          likeCount: post.likes?.length || 0,
          hasLiked: (post.likes || []).some((likeId) => String(likeId) === String(req.user._id)),
          author: {
            userId: post.authorId?._id || post.authorId,
            username: post.authorId?.username || "Membre",
            avatar: post.authorId?.avatar || ""
          }
        }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
      polls: club.polls
        .map((poll) => ({
          _id: poll._id,
          question: poll.question,
          createdAt: poll.createdAt,
          expiresAt: poll.expiresAt,
          createdBy: {
            userId: poll.createdBy?._id || poll.createdBy,
            username: poll.createdBy?.username || "Membre",
            avatar: poll.createdBy?.avatar || ""
          },
          options: poll.options.map((option, index) => ({
            index,
            label: option.label,
            voteCount: option.voters.length,
            hasVoted: option.voters.some((voterId) => String(voterId) === String(req.user._id))
          })),
          totalVotes: poll.options.reduce((acc, option) => acc + option.voters.length, 0)
        }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    });
  } catch (error) {
    return next(error);
  }
};

const createClubPost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ message: "content is required" });
    }

    const club = await Club.findById(id);
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    if (!ensureMembership(club, req.user._id, res)) return;

    club.posts.unshift({ authorId: req.user._id, content: content.trim() });
    addPoints(club, req.user._id, 8);
    touchMemberActivity(club, req.user._id);
    await club.save();

    await fanoutClubNotification({
      club,
      actorId: req.user._id,
      actorUsername: req.user.username,
      type: "club_post",
      message: `${req.user.username} a publie dans ${club.name}`
    });

    return res.status(201).json({ message: "Post created" });
  } catch (error) {
    return next(error);
  }
};

const togglePostLike = async (req, res, next) => {
  try {
    const { id, postId } = req.params;
    const club = await Club.findById(id);
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    if (!ensureMembership(club, req.user._id, res)) return;

    const post = club.posts.id(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const likeIndex = post.likes.findIndex((likeId) => String(likeId) === String(req.user._id));
    let liked = false;

    if (likeIndex >= 0) {
      post.likes.splice(likeIndex, 1);
    } else {
      post.likes.push(req.user._id);
      addPoints(club, post.authorId, 2);
      liked = true;
    }

    touchMemberActivity(club, req.user._id);
    await club.save();

    return res.json({ liked, likeCount: post.likes.length });
  } catch (error) {
    return next(error);
  }
};

const createPoll = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { question, options = [], expiresAt = null } = req.body;

    if (!question?.trim()) {
      return res.status(400).json({ message: "question is required" });
    }

    const sanitizedOptions = options
      .map((option) => String(option || "").trim())
      .filter(Boolean)
      .slice(0, 6);

    if (sanitizedOptions.length < 2) {
      return res.status(400).json({ message: "At least 2 options are required" });
    }

    const club = await Club.findById(id);
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    if (!ensureMembership(club, req.user._id, res)) return;

    club.polls.unshift({
      question: question.trim(),
      options: sanitizedOptions.map((label) => ({ label, voters: [] })),
      createdBy: req.user._id,
      expiresAt: expiresAt ? new Date(expiresAt) : null
    });

    addPoints(club, req.user._id, 10);
    touchMemberActivity(club, req.user._id);
    await club.save();

    return res.status(201).json({ message: "Poll created" });
  } catch (error) {
    return next(error);
  }
};

const votePoll = async (req, res, next) => {
  try {
    const { id, pollId } = req.params;
    const { optionIndex } = req.body;

    if (!Number.isInteger(optionIndex)) {
      return res.status(400).json({ message: "optionIndex must be an integer" });
    }

    const club = await Club.findById(id);
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    if (!ensureMembership(club, req.user._id, res)) return;

    const poll = club.polls.id(pollId);
    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    if (poll.expiresAt && new Date(poll.expiresAt).getTime() < Date.now()) {
      return res.status(400).json({ message: "Poll has expired" });
    }

    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      return res.status(400).json({ message: "Invalid optionIndex" });
    }

    poll.options.forEach((option) => {
      option.voters = option.voters.filter((voterId) => String(voterId) !== String(req.user._id));
    });

    poll.options[optionIndex].voters.push(req.user._id);
    addPoints(club, req.user._id, 4);
    touchMemberActivity(club, req.user._id);
    await club.save();

    await fanoutClubNotification({
      club,
      actorId: req.user._id,
      actorUsername: req.user.username,
      type: "club_vote",
      message: `${req.user.username} a vote dans un sondage de ${club.name}`
    });

    const voteCounts = poll.options.map((option) => option.voters.length);
    const totalVotes = voteCounts.reduce((sum, voteCount) => sum + voteCount, 0);

    return res.json({ voteCounts, totalVotes });
  } catch (error) {
    return next(error);
  }
};

const updateMemberRole = async (req, res, next) => {
  try {
    const { id, memberId } = req.params;
    const { role } = req.body;

    if (!["member", "admin"].includes(role)) {
      return res.status(400).json({ message: "role must be member or admin" });
    }

    const club = await Club.findById(id);
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    const actor = getMember(club, req.user._id);
    if (!actor || !["owner", "admin"].includes(actor.role)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const target = getMember(club, memberId);
    if (!target) {
      return res.status(404).json({ message: "Member not found" });
    }

    if (String(target.userId) === String(req.user._id)) {
      return res.status(400).json({ message: "Use dedicated endpoint to leave or ask owner for role changes" });
    }

    if (target.role === "owner") {
      return res.status(400).json({ message: "Owner role cannot be changed" });
    }

    if (actor.role !== "owner" && (role === "admin" || target.role === "admin")) {
      return res.status(403).json({ message: "Only owner can manage admins" });
    }

    const previousRole = target.role;
    target.role = role;
    touchMemberActivity(club, req.user._id);

    const targetUser = await User.findById(target.userId).select("username").lean();

    appendAuditLog(club, {
      action: "role_update",
      actorId: req.user._id,
      actorUsername: req.user.username,
      targetUserId: target.userId,
      targetUsername: targetUser?.username || "Membre",
      metadata: { fromRole: previousRole, toRole: role }
    });

    await club.save();

    await fanoutClubNotification({
      club,
      actorId: req.user._id,
      actorUsername: req.user.username,
      type: "club_post",
      message: `${req.user.username} a passe ${targetUser?.username || "un membre"} en ${role}`
    });

    return res.json({ message: "Role updated" });
  } catch (error) {
    return next(error);
  }
};

const removeMember = async (req, res, next) => {
  try {
    const { id, memberId } = req.params;
    const club = await Club.findById(id);
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    const actor = getMember(club, req.user._id);
    if (!actor || !["owner", "admin"].includes(actor.role)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const target = getMember(club, memberId);
    if (!target) {
      return res.status(404).json({ message: "Member not found" });
    }

    if (String(target.userId) === String(req.user._id)) {
      return res.status(400).json({ message: "Use leave endpoint for yourself" });
    }

    if (target.role === "owner") {
      return res.status(400).json({ message: "Owner cannot be removed" });
    }

    if (actor.role !== "owner" && target.role !== "member") {
      return res.status(403).json({ message: "Only owner can remove admins" });
    }

    const targetUser = await User.findById(target.userId).select("username").lean();

    club.members = club.members.filter((member) => String(member.userId) !== String(memberId));
    club.posts.unshift({
      authorId: req.user._id,
      content: `${req.user.username} a retire un membre du club.`
    });

    appendAuditLog(club, {
      action: "member_removed",
      actorId: req.user._id,
      actorUsername: req.user.username,
      targetUserId: target.userId,
      targetUsername: targetUser?.username || "Membre",
      metadata: { fromRole: target.role, toRole: null }
    });

    touchMemberActivity(club, req.user._id);
    await club.save();

    await fanoutClubNotification({
      club,
      actorId: req.user._id,
      actorUsername: req.user.username,
      type: "club_post",
      message: `${req.user.username} a retire ${targetUser?.username || "un membre"} de ${club.name}`
    });

    return res.json({ message: "Member removed" });
  } catch (error) {
    return next(error);
  }
};

const getClubStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const days = Math.min(30, Math.max(1, Number(req.query.days) || 7));
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const club = await Club.findById(id)
      .populate("members.userId", "username avatar")
      .populate("posts.authorId", "username avatar");

    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    if (!ensureMembership(club, req.user._id, res)) return;

    const recentPosts = club.posts.filter((post) => new Date(post.createdAt) >= startDate);
    const recentPolls = club.polls.filter((poll) => new Date(poll.createdAt) >= startDate);

    const contributorMap = new Map();

    const ensureContributor = (member) => {
      const userId = String(member.userId?._id || member.userId);
      if (!contributorMap.has(userId)) {
        contributorMap.set(userId, {
          userId,
          username: member.userId?.username || "Membre",
          avatar: member.userId?.avatar || "",
          points: member.points || 0,
          posts: 0,
          votes: 0,
          likesReceived: 0
        });
      }
      return contributorMap.get(userId);
    };

    club.members.forEach((member) => ensureContributor(member));

    recentPosts.forEach((post) => {
      const authorId = String(post.authorId?._id || post.authorId);
      const existing = contributorMap.get(authorId);
      if (existing) {
        existing.posts += 1;
        existing.likesReceived += post.likes?.length || 0;
      }
    });

    recentPolls.forEach((poll) => {
      poll.options.forEach((option) => {
        option.voters.forEach((voterId) => {
          const key = String(voterId);
          const existing = contributorMap.get(key);
          if (existing) {
            existing.votes += 1;
          }
        });
      });
    });

    const dayBuckets = Array.from({ length: days }).map((_, index) => {
      const date = new Date(startDate.getTime() + index * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().slice(0, 10);
      return {
        date: dateKey,
        label: date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
        posts: 0,
        polls: 0
      };
    });

    const bucketByDate = new Map(dayBuckets.map((bucket) => [bucket.date, bucket]));

    recentPosts.forEach((post) => {
      const key = new Date(post.createdAt).toISOString().slice(0, 10);
      const bucket = bucketByDate.get(key);
      if (bucket) bucket.posts += 1;
    });

    recentPolls.forEach((poll) => {
      const key = new Date(poll.createdAt).toISOString().slice(0, 10);
      const bucket = bucketByDate.get(key);
      if (bucket) bucket.polls += 1;
    });

    const participationItems = recentPolls.map((poll) => {
      const uniqueVoters = new Set();
      poll.options.forEach((option) => {
        option.voters.forEach((voterId) => uniqueVoters.add(String(voterId)));
      });

      const participantCount = uniqueVoters.size;
      const participationRate = club.members.length
        ? Number(((participantCount / club.members.length) * 100).toFixed(1))
        : 0;

      return {
        pollId: poll._id,
        question: poll.question,
        participantCount,
        totalMembers: club.members.length,
        participationRate,
        createdAt: poll.createdAt
      };
    });

    const averageParticipationRate = participationItems.length
      ? Number(
          (
            participationItems.reduce((sum, item) => sum + item.participationRate, 0) /
            participationItems.length
          ).toFixed(1)
        )
      : 0;

    const totalVotesOnRecentPolls = recentPolls.reduce(
      (sum, poll) => sum + poll.options.reduce((voteAcc, option) => voteAcc + option.voters.length, 0),
      0
    );

    const topContributors = Array.from(contributorMap.values())
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.posts !== a.posts) return b.posts - a.posts;
        return b.votes - a.votes;
      })
      .slice(0, 5);

    return res.json({
      windowDays: days,
      summary: {
        memberCount: club.members.length,
        posts: recentPosts.length,
        polls: recentPolls.length,
        votes: totalVotesOnRecentPolls,
        averageParticipationRate
      },
      activityByDay: dayBuckets,
      topContributors,
      pollParticipation: participationItems
    });
  } catch (error) {
    return next(error);
  }
};

const streamClubEvents = async (req, res, next) => {
  try {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    if (typeof res.flushHeaders === "function") {
      res.flushHeaders();
    }

    const sendEvent = (event, data) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    sendEvent("ready", { ok: true, ts: Date.now() });

    const unsubscribe = subscribeUserClubEvents(req.user._id, (payload) => {
      sendEvent("club-event", payload);
    });

    const keepAliveTimer = setInterval(() => {
      res.write(": keep-alive\n\n");
    }, 25000);

    req.on("close", () => {
      clearInterval(keepAliveTimer);
      unsubscribe();
      res.end();
    });
  } catch (error) {
    return next(error);
  }
};

const transferOwnership = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { targetMemberId, previousOwnerRole = "admin" } = req.body;

    if (!["admin", "member"].includes(previousOwnerRole)) {
      return res.status(400).json({ message: "previousOwnerRole must be admin or member" });
    }

    const club = await Club.findById(id);
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    const owner = getMember(club, req.user._id);
    if (!owner || owner.role !== "owner") {
      return res.status(403).json({ message: "Only owner can transfer ownership" });
    }

    const target = getMember(club, targetMemberId);
    if (!target) {
      return res.status(404).json({ message: "Target member not found" });
    }

    if (String(target.userId) === String(req.user._id)) {
      return res.status(400).json({ message: "You already own this club" });
    }

    const targetUser = await User.findById(target.userId).select("username").lean();
    const targetPreviousRole = target.role;

    owner.role = previousOwnerRole;
    target.role = "owner";
    club.ownerId = target.userId;

    appendAuditLog(club, {
      action: "ownership_transfer",
      actorId: req.user._id,
      actorUsername: req.user.username,
      targetUserId: target.userId,
      targetUsername: targetUser?.username || "Membre",
      metadata: {
        fromRole: targetPreviousRole,
        toRole: "owner",
        previousOwnerRole
      }
    });

    touchMemberActivity(club, req.user._id);
    touchMemberActivity(club, target.userId);
    await club.save();

    await fanoutClubNotification({
      club,
      actorId: req.user._id,
      actorUsername: req.user.username,
      type: "club_post",
      message: `${req.user.username} a transfere la propriete a ${targetUser?.username || "un membre"}`
    });

    return res.json({ message: "Ownership transferred" });
  } catch (error) {
    return next(error);
  }
};

const getClubNotifications = async (req, res, next) => {
  try {
    const { id } = req.params;
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
    const onlyUnread = String(req.query.unread || "") === "1";

    const club = await Club.findById(id).select("members.userId");
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    if (!ensureMembership(club, req.user._id, res)) return;

    const notifications = await Notification.find({
      ...clubNotificationQuery,
      recipientId: req.user._id,
      targetId: id,
      ...(onlyUnread ? { read: false } : {})
    })
      .populate("senderId", "username avatar")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.json(notifications);
  } catch (error) {
    return next(error);
  }
};

const getClubUnreadCount = async (req, res, next) => {
  try {
    const { id } = req.params;
    const club = await Club.findById(id).select("members.userId");
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    if (!ensureMembership(club, req.user._id, res)) return;

    const unreadCount = await Notification.countDocuments({
      ...clubNotificationQuery,
      recipientId: req.user._id,
      targetId: id,
      read: false
    });

    return res.json({ unreadCount });
  } catch (error) {
    return next(error);
  }
};

const getGlobalClubUnreadCount = async (req, res, next) => {
  try {
    const unreadCount = await Notification.countDocuments({
      ...clubNotificationQuery,
      recipientId: req.user._id,
      read: false
    });

    return res.json({ unreadCount });
  } catch (error) {
    return next(error);
  }
};

const markClubNotificationsAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const club = await Club.findById(id).select("members.userId");
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    if (!ensureMembership(club, req.user._id, res)) return;

    const update = await Notification.updateMany(
      {
        ...clubNotificationQuery,
        recipientId: req.user._id,
        targetId: id,
        read: false
      },
      { read: true }
    );

    const modifiedCount = update?.modifiedCount || 0;
    await decreaseUserUnreadCount(req.user._id, modifiedCount);

    return res.json({ marked: modifiedCount });
  } catch (error) {
    return next(error);
  }
};

const getClubAuditLogs = async (req, res, next) => {
  try {
    const { id } = req.params;
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 40));

    const club = await Club.findById(id).select("members.userId auditLogs");
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    if (!ensureMembership(club, req.user._id, res)) return;

    return res.json((club.auditLogs || []).slice(0, limit));
  } catch (error) {
    return next(error);
  }
};

const getClubRanking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const club = await Club.findById(id).populate("members.userId", "username avatar");
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    if (!ensureMembership(club, req.user._id, res)) return;

    const ranking = club.members
      .map((member) => ({
        userId: member.userId?._id || member.userId,
        username: member.userId?.username || "Membre",
        avatar: member.userId?.avatar || "",
        role: member.role,
        points: member.points || 0,
        lastActiveAt: member.lastActiveAt
      }))
      .sort((a, b) => b.points - a.points);

    return res.json(ranking);
  } catch (error) {
    return next(error);
  }
};

const regenerateInviteCode = async (req, res, next) => {
  try {
    const { id } = req.params;
    const club = await Club.findById(id);
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    if (!canManage(club, req.user._id)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    club.inviteCode = await generateUniqueInviteCode();
    touchMemberActivity(club, req.user._id);
    await club.save();

    return res.json({ inviteCode: club.inviteCode });
  } catch (error) {
    return next(error);
  }
};

const leaveClub = async (req, res, next) => {
  try {
    const { id } = req.params;
    const club = await Club.findById(id);
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    if (!ensureMembership(club, req.user._id, res)) return;

    const member = getMember(club, req.user._id);
    if (member?.role === "owner") {
      return res.status(400).json({ message: "Owner cannot leave without transferring ownership" });
    }

    club.members = club.members.filter((item) => String(item.userId) !== String(req.user._id));
    club.posts.unshift({ authorId: req.user._id, content: `${req.user.username} a quitte le club.` });
    await club.save();

    emitClubEventToUsers(toObjectIdList(club), {
      clubId: String(club._id),
      type: "club_post",
      message: `${req.user.username} a quitte ${club.name}`,
      actorId: String(req.user._id),
      actorUsername: req.user.username
    });

    return res.json({ message: "Left club" });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listMyClubs,
  createClub,
  joinClubByCode,
  getClubDetails,
  getClubNotifications,
  getClubUnreadCount,
  getGlobalClubUnreadCount,
  markClubNotificationsAsRead,
  createClubPost,
  togglePostLike,
  createPoll,
  votePoll,
  updateMemberRole,
  removeMember,
  transferOwnership,
  getClubRanking,
  getClubStats,
  getClubAuditLogs,
  streamClubEvents,
  regenerateInviteCode,
  leaveClub
};
